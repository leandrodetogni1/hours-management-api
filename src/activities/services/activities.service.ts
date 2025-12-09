import { Injectable } from '@nestjs/common';
import { ActivitiesRepository } from '../repositories/activities.repository';

@Injectable()
export class ActivitiesService {
  constructor(private activityRepository: ActivitiesRepository) {}

  createActivity() {
    return this.activityRepository.createActivity();
  }
}
