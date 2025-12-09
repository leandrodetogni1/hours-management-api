import { Module } from '@nestjs/common';
import { ActivitiesServiceModule } from './services/activities.module';
import { ActivitiesController } from './activities.controller';

@Module({
  imports: [ActivitiesServiceModule],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}
