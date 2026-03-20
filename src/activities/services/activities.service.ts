import { Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { CreateActivityDto } from '../dto/CreateActivityDto';
import {
  ActivityResponseDto,
  CreateActivityResponseDto,
  UpdateActivityStatusResponseDto,
} from '../dto/ActivityResponseDto';

@Injectable()
export class ActivitiesService {
  constructor(private activityRepository: ActivitiesRepository) {}

  getAllActivities(): Promise<ActivityResponseDto[]> {
    return this.activityRepository.getAll();
  }

  createActivity(
    activity: CreateActivityDto,
  ): Promise<CreateActivityResponseDto> {
    return this.activityRepository.createActivity(activity);
  }

  approveActivity(id: string): Promise<UpdateActivityStatusResponseDto> {
    return this.activityRepository.updateActivityStatus(id, Status.APPROVED);
  }

  rejectActivity(id: string): Promise<UpdateActivityStatusResponseDto> {
    return this.activityRepository.updateActivityStatus(id, Status.REJECTED);
  }
}
