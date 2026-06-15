import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from './services/audit.service.js';
import { GetAuditLogsQueryDto } from './dto/GetAuditLogsQueryDto.js';
import { AuditLogsPageDto } from './dto/AuditLogResponseDto.js';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator.js';

const OWNER_ROLES = ['owner'];

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiEndpoint({
    summary:
      'Listar a trilha de auditoria (paginada, filtros opcionais) — owner apenas',
    description: 'Página de registros de auditoria',
    type: AuditLogsPageDto,
    roles: OWNER_ROLES,
  })
  findAll(@Query() query: GetAuditLogsQueryDto): Promise<AuditLogsPageDto> {
    return this.auditService.getLogs(query);
  }
}
