import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Status } from '@prisma/client';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { CreateActivityDto } from '../dto/CreateActivityDto';
import {
  ActivityResponseDto,
  CreateActivityResponseDto,
  UpdateActivityStatusResponseDto,
} from '../dto/ActivityResponseDto';
import { ActivityEventResponseDto } from '../dto/ActivityEventResponseDto';
import { ActivitySummaryResponseDto } from '../dto/ActivitySummaryResponseDto';
import { JwtUserPayload } from '../../auth/decorators/current-user.decorator';

const EVENTS_PRIVILEGED_ROLES = ['owner', 'admin', 'reviewer'] as const;

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

  getSummaryByUserId(userId: string): Promise<ActivitySummaryResponseDto> {
    return this.activityRepository.getSummaryByAuthorId(userId);
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

  async getActivityEvents(
    activityId: string,
    currentUser: JwtUserPayload,
  ): Promise<ActivityEventResponseDto[]> {
    const authorId = await this.activityRepository.findOwnerId(activityId);
    if (!authorId) {
      throw new NotFoundException(`Activity with id ${activityId} not found`);
    }

    const isPrivileged =
      typeof currentUser.role === 'string' &&
      (EVENTS_PRIVILEGED_ROLES as readonly string[]).includes(currentUser.role);

    if (!isPrivileged && currentUser.sub !== authorId) {
      throw new ForbiddenException(
        'Acesso negado. Apenas o dono da atividade ou owner/admin/reviewer',
      );
    }

    return this.activityRepository.getEvents(activityId);
  }
}
