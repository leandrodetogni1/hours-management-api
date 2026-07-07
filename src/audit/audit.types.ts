export interface AuditLogEntry {
  actorId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
}
