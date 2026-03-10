import { Module } from '@nestjs/common';
import { ActivityTypesService } from './activity-types.service';
import { ActivityTypesRepositoryModule } from '../repositories/activity-types.module';

@Module({
  imports: [ActivityTypesRepositoryModule],
  providers: [ActivityTypesService],
  exports: [ActivityTypesService],
})
export class ActivityTypesServiceModule {}
