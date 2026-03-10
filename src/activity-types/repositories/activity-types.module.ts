import { Module } from '@nestjs/common';
import { ActivityTypesRepository } from './activity-types.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ActivityTypesRepository],
  exports: [ActivityTypesRepository],
})
export class ActivityTypesRepositoryModule {}
