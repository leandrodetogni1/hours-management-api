import { Injectable } from '@nestjs/common';
import { CreateActivityDto } from '../dto/CreateActivityDto';

@Injectable()
export class ActivitiesRepository {
  createActivity(activity: CreateActivityDto) {
    console.log('Activity created:', activity);
    return { message: 'Activity created successfully' };
  }
}
