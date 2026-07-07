import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuditService } from './services/audit.service';
import {
  AUDIT_KEY,
  AuditOptions,
  AuditRequestContext,
} from './audit.decorator';
import { AuditLogEntry } from './audit.types';

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

interface AuditHttpRequest extends AuditRequestContext {
  method: string;
  path?: string;
  originalUrl?: string;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const options = this.reflector.get<AuditOptions | undefined>(
      AUDIT_KEY,
      context.getHandler(),
    );
    const req = context.switchToHttp().getRequest<AuditHttpRequest>();
    const isMutation = MUTATION_METHODS.has(req.method);

    if (!options && !isMutation) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((result) => {
        const res = context
          .switchToHttp()
          .getResponse<{ statusCode?: number }>();
        const entry = this.buildEntry(
          req,
          options,
          unwrapEnvelope(result),
          res?.statusCode,
        );
        void this.auditService.safeRecord(entry);
      }),
    );
  }

  private buildEntry(
    req: AuditHttpRequest,
    options: AuditOptions | undefined,
    result: unknown,
    statusCode?: number,
  ): AuditLogEntry {
    const path = req.path ?? req.originalUrl?.split('?')[0] ?? null;
    const entityType = options?.entityType ?? entityFromPath(path);
    const action =
      options?.action ?? `${entityType ?? 'http'}.${req.method.toLowerCase()}`;

    const entityId = options?.resolveEntityId
      ? (options.resolveEntityId(req) ?? null)
      : (req.params?.[options?.entityIdParam ?? 'id'] ?? null);

    const actorId = options?.resolveActorId
      ? (options.resolveActorId(req, result) ?? null)
      : (req.user?.sub ?? null);

    const userAgentHeader = req.headers?.['user-agent'];
    const userAgent =
      typeof userAgentHeader === 'string'
        ? userAgentHeader.slice(0, 500)
        : null;

    const metadata = options?.resolveMetadata
      ? (options.resolveMetadata(req, result) ?? null)
      : defaultMetadata(result);

    return {
      actorId,
      action,
      entityType: entityType ?? null,
      entityId,
      method: req.method,
      path,
      statusCode: statusCode ?? null,
      ip: clientIp(req),
      userAgent,
      metadata,
    };
  }
}

export function unwrapEnvelope(result: unknown): unknown {
  if (
    typeof result === 'object' &&
    result !== null &&
    !Array.isArray(result) &&
    Object.keys(result).length === 1 &&
    'data' in result
  ) {
    return (result as Record<string, unknown>).data;
  }
  return result;
}

export function defaultMetadata(
  result: unknown,
): Record<string, unknown> | null {
  if (typeof result !== 'object' || result === null || Array.isArray(result)) {
    return null;
  }

  const source = result as Record<string, unknown>;
  const metadata: Record<string, unknown> = {};

  const firstName =
    typeof source.firstName === 'string' ? source.firstName : '';
  const lastName = typeof source.lastName === 'string' ? source.lastName : '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const label =
    fullName ||
    [source.event, source.title, source.name, source.email].find(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
  if (label) {
    metadata.label = label;
  }

  if (typeof source.email === 'string') {
    metadata.email = source.email;
  }
  if (typeof source.role === 'string') {
    metadata.role = source.role;
  }
  if (typeof source.userId === 'string') {
    metadata.userId = source.userId;
  }

  return Object.keys(metadata).length > 0 ? metadata : null;
}

export function entityFromPath(path: string | null): string | null {
  if (!path) return null;
  const parts = path.split('/').filter(Boolean);
  const apiIndex = parts.indexOf('api');
  const segment = apiIndex >= 0 ? parts[apiIndex + 1] : parts[0];
  return segment ?? null;
}

export function clientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}): string | null {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim().slice(0, 64);
  }
  return req.ip?.slice(0, 64) ?? null;
}
