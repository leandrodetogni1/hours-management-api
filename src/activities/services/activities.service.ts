import { Injectable } from '@nestjs/common';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { CreateActivityDto } from '../dto/CreateActivityDto';

@Injectable()
export class ActivitiesService {
  constructor(private activityRepository: ActivitiesRepository) {}

  createActivity(activity: CreateActivityDto) {
    return this.activityRepository.createActivity(activity);
  }
}
