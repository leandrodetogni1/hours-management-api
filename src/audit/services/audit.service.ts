import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository } from '../repositories/audit.repository';
import { AuditLogEntry } from '../audit.types';
import { GetAuditLogsQueryDto } from '../dto/GetAuditLogsQueryDto';
import { AuditLogsPageDto } from '../dto/AuditLogResponseDto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private auditRepository: AuditRepository) {}

  async safeRecord(entry: AuditLogEntry): Promise<void> {
    try {
      await this.auditRepository.create(entry);
    } catch (error) {
      this.logger.error(
        `Failed to write audit log for action "${entry.action}"`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  getLogs(query: GetAuditLogsQueryDto): Promise<AuditLogsPageDto> {
    return this.auditRepository.getMany(query);
  }
}
