import { Module } from '@nestjs/common';
import { ActivityTypesServiceModule } from './services/activity-types.module';
import { ActivityTypesController } from './activity-types.controller';

@Module({
  imports: [ActivityTypesServiceModule],
  controllers: [ActivityTypesController],
})
export class ActivityTypesModule {}
