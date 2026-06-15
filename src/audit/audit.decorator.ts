import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditRequestContext {
  params: Record<string, string>;
  body: Record<string, unknown>;
  user?: { sub: string; email: string; role: string | null };
}

export interface AuditOptions {
  action: string;
  entityType?: string;
  entityIdParam?: string;
  resolveEntityId?: (req: AuditRequestContext) => string | null | undefined;
  resolveActorId?: (
    req: AuditRequestContext,
    result: unknown,
  ) => string | null | undefined;
}

export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);
