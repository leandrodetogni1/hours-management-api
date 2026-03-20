import { Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { CreateActivityDto } from '../dto/CreateActivityDto';

@Injectable()
export class ActivitiesService {
  constructor(private activityRepository: ActivitiesRepository) {}

  getAllActivities() {
    return this.activityRepository.getAll();
  }

  createActivity(activity: CreateActivityDto) {
    return this.activityRepository.createActivity(activity);
  }

  approveActivity(id: string) {
    return this.activityRepository.updateActivityStatus(id, Status.APPROVED);
  }

  rejectActivity(id: string) {
    return this.activityRepository.updateActivityStatus(id, Status.REJECTED);
  }
}
