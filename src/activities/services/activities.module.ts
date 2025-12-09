import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesRepositoryModule } from '../repositories/activities.module';

@Module({
  imports: [ActivitiesRepositoryModule],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesServiceModule {}
