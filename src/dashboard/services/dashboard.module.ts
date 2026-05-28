import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardRepositoryModule } from '../repositories/dashboard.module.js';
import { CurriculaRepositoryModule } from '../../curricula/repositories/curricula.module.js';

@Module({
  imports: [DashboardRepositoryModule, CurriculaRepositoryModule],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardServiceModule {}
