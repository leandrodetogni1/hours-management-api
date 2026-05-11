import { Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { CreateActivityDto } from '../dto/CreateActivityDto';
import {
  ActivityResponseDto,
  CreateActivityResponseDto,
  UpdateActivityStatusResponseDto,
} from '../dto/ActivityResponseDto';
import { ActivityEventResponseDto } from '../dto/ActivityEventResponseDto';

@Injectable()
export class ActivitiesService {
  constructor(private activityRepository: ActivitiesRepository) {}

  getAllActivities(
    authorId?: string,
    status?: Status,
  ): Promise<ActivityResponseDto[]> {
    if (authorId) {
      return this.activityRepository.getByAuthorId(authorId, status);
    }
    return this.activityRepository.getAll(status);
  }

  getActivitiesByUserId(
    userId: string,
    status?: Status,
  ): Promise<ActivityResponseDto[]> {
    return this.activityRepository.getByAuthorId(userId, status);
  }

  createActivity(
    authorId: string,
    activity: CreateActivityDto,
  ): Promise<CreateActivityResponseDto> {
    return this.activityRepository.createActivity(authorId, activity);
  }

  approveActivity(
    id: string,
    actorId: string,
    comment?: string,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activityRepository.updateActivityStatus(
      id,
      Status.APPROVED,
      actorId,
      comment,
    );
  }

  rejectActivity(
    id: string,
    actorId: string,
    comment?: string,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activityRepository.updateActivityStatus(
      id,
      Status.REJECTED,
      actorId,
      comment,
    );
  }

  verifyActivity(
    id: string,
    actorId: string,
    comment?: string,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activityRepository.updateActivityStatus(
      id,
      Status.VERIFIED,
      actorId,
      comment,
    );
  }

  getActivityEvents(activityId: string): Promise<ActivityEventResponseDto[]> {
    return this.activityRepository.getEvents(activityId);
  }
}
