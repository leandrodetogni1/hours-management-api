import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardServiceModule } from './services/dashboard.module.js';

@Module({
  imports: [DashboardServiceModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
