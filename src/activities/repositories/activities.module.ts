import { Module } from '@nestjs/common';
import { ActivitiesRepository } from './activities.repository';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [ActivitiesRepository],
  exports: [ActivitiesRepository],
})
export class ActivitiesRepositoryModule {}
