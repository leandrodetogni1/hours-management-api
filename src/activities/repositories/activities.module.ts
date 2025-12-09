import { Module } from '@nestjs/common';
import { ActivitiesRepository } from './activities.repository';

@Module({
  providers: [ActivitiesRepository],
  exports: [ActivitiesRepository],
})
export class ActivitiesRepositoryModule {}
