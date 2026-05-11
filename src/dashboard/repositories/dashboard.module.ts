import { Module } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [DashboardRepository],
  exports: [DashboardRepository],
})
export class DashboardRepositoryModule {}
