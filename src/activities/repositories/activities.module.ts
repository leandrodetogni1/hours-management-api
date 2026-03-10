import { Module } from '@nestjs/common';
import { ActivitiesRepository } from './activities.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ActivitiesRepository],
  exports: [ActivitiesRepository],
})
export class ActivitiesRepositoryModule {}
