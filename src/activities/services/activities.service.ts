import { Injectable } from '@nestjs/common';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { CreateActivityDto } from '../dto/CreateActivityDto';

@Injectable()
export class ActivitiesService {
  constructor(private activityRepository: ActivitiesRepository) {}

  getAllActivities() {
    return this.activityRepository.getAll();
  }

  createActivity(activity: CreateActivityDto, files: Express.Multer.File[]) {
    return this.activityRepository.createActivity(activity, files);
  }
}
