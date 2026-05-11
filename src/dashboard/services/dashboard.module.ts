import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardRepositoryModule } from '../repositories/dashboard.module.js';

@Module({
  imports: [DashboardRepositoryModule],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardServiceModule {}
