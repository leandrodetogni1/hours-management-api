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

  getAllActivities(authorId?: string): Promise<ActivityResponseDto[]> {
    if (authorId) {
      return this.activityRepository.getByAuthorId(authorId);
    }
    return this.activityRepository.getAll();
  }

  getActivitiesByUserId(userId: string): Promise<ActivityResponseDto[]> {
    return this.activityRepository.getByAuthorId(userId);
  }

  createActivity(
    authorId: string,
    activity: CreateActivityDto,
  ): Promise<CreateActivityResponseDto> {
    return this.activityRepository.createActivity(authorId, activity);
  }

  approveActivity(id: string): Promise<UpdateActivityStatusResponseDto> {
    return this.activityRepository.updateActivityStatus(id, Status.APPROVED);
  }

  rejectActivity(id: string): Promise<UpdateActivityStatusResponseDto> {
    return this.activityRepository.updateActivityStatus(id, Status.REJECTED);
  }

  verifyActivity(id: string): Promise<UpdateActivityStatusResponseDto> {
    return this.activityRepository.updateActivityStatus(id, Status.VERIFIED);
  }
}
