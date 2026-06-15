import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MulterError } from 'multer';
import { AuditService } from '../../audit/services/audit.service.js';
import { clientIp, entityFromPath } from '../../audit/audit.interceptor.js';

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

interface AuditableRequest extends Request {
  user?: { sub: string; email: string; role: string | null };
}

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly auditService: AuditService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuditableRequest>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof MulterError) {
      const isTooLarge = exception.code === 'LIMIT_FILE_SIZE';
      status = isTooLarge
        ? HttpStatus.PAYLOAD_TOO_LARGE
        : HttpStatus.BAD_REQUEST;
      message = isTooLarge
        ? 'Arquivo excede o tamanho máximo de 5MB'
        : exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        message = (exceptionResponse as { message: string | string[] }).message;
      } else {
        message = exception.message;
      }
    } else {
      console.error('Unhandled exception:', exception);
    }

    this.auditFailure(request, status);

    response.status(status).json({
      statusCode: status,
      message,
    });
  }

  private auditFailure(request: AuditableRequest, status: number): void {
    const isMutation = MUTATION_METHODS.has(request.method);
    if (!isMutation) {
      return;
    }

    const path = request.path ?? request.originalUrl?.split('?')[0] ?? null;
    const isLoginRoute = !!path && path.includes('/auth/');
    const entityType = entityFromPath(path);
    const action = isLoginRoute
      ? 'auth.login'
      : `${entityType ?? 'http'}.${request.method.toLowerCase()}`;
    const userAgentHeader = request.headers['user-agent'];

    void this.auditService.safeRecord({
      actorId: request.user?.sub ?? null,
      action,
      entityType: entityType ?? null,
      entityId: request.params?.id ?? null,
      method: request.method,
      path,
      statusCode: status,
      ip: clientIp(request),
      userAgent:
        typeof userAgentHeader === 'string'
          ? userAgentHeader.slice(0, 500)
          : null,
    });
  }
}
