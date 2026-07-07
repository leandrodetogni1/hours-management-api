import { AuditLogResponseDto } from '../dto/AuditLogResponseDto';

export class AuditLogMapper {
  static toResponseDto(log: {
    id: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    method: string | null;
    path: string | null;
    statusCode: number | null;
    ip: string | null;
    userAgent: string | null;
    metadata: unknown;
    createdAt: Date | null;
    actor: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      picture: string | null;
    } | null;
  }): AuditLogResponseDto {
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      method: log.method,
      path: log.path,
      statusCode: log.statusCode,
      ip: log.ip,
      userAgent: log.userAgent,
      metadata:
        typeof log.metadata === 'object' &&
        log.metadata !== null &&
        !Array.isArray(log.metadata)
          ? (log.metadata as Record<string, unknown>)
          : null,
      createdAt: log.createdAt?.toISOString() ?? null,
      actor: log.actor,
    };
  }
}
