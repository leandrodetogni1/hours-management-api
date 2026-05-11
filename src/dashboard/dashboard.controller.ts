import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './services/dashboard.service.js';
import { AdminDashboardResponseDto } from './dto/AdminDashboardResponseDto.js';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator.js';

const PRIVILEGED_ROLES = ['owner', 'admin', 'reviewer'];

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('admin')
  @ApiEndpoint({
    summary:
      'Dashboard administrativo — owner/admin/reviewer apenas (formandos com gaps, fila de revisão e estatísticas)',
    description: 'Dados agregados para painel administrativo',
    type: AdminDashboardResponseDto,
    roles: PRIVILEGED_ROLES,
  })
  getAdminDashboard(): Promise<AdminDashboardResponseDto> {
    return this.dashboardService.getAdminDashboard();
  }
}
