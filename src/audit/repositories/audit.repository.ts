import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditLogEntry } from '../audit.types';
import { GetAuditLogsQueryDto } from '../dto/GetAuditLogsQueryDto';
import { AuditLogsPageDto } from '../dto/AuditLogResponseDto';
import { AuditLogMapper } from '../mappers/audit-log.mapper';

const auditActorSelect = {
  select: { id: true, email: true, firstName: true, lastName: true },
} as const;

@Injectable()
export class AuditRepository {
  constructor(private prisma: PrismaService) {}

  async create(entry: AuditLogEntry): Promise<void> {
    await this.prisma.audit_logs.create({ data: entry });
  }

  async getMany(query: GetAuditLogsQueryDto): Promise<AuditLogsPageDto> {
    const where: Prisma.audit_logsWhereInput = {
      ...(query.actorId && { actorId: query.actorId }),
      ...(query.action && { action: query.action }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.entityId && { entityId: query.entityId }),
      ...((query.from || query.to) && {
        createdAt: {
          ...(query.from && { gte: query.from }),
          ...(query.to && { lte: query.to }),
        },
      }),
    };

    const [total, logs] = await this.prisma.$transaction([
      this.prisma.audit_logs.count({ where }),
      this.prisma.audit_logs.findMany({
        where,
        include: { actor: auditActorSelect },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return {
      items: logs.map((l) => AuditLogMapper.toResponseDto(l)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}
