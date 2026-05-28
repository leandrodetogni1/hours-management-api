import { Module } from '@nestjs/common';
import { ActivitiesRepository } from './activities.repository';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { CurriculaRepositoryModule } from '../../curricula/repositories/curricula.module.js';

@Module({
  imports: [PrismaModule, CurriculaRepositoryModule],
  providers: [ActivitiesRepository],
  exports: [ActivitiesRepository],
})
export class ActivitiesRepositoryModule {}
