import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Status } from '@prisma/client';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { CreateActivityDto } from '../dto/CreateActivityDto';
import { UpdateActivityDto } from '../dto/UpdateActivityDto';
import {
  ActivityResponseDto,
  CreateActivityResponseDto,
  DeleteActivityResponseDto,
  UpdateActivityResponseDto,
} from '../dto/ActivityResponseDto';
import { ActivityEventResponseDto } from '../dto/ActivityEventResponseDto';
import { ActivitySummaryResponseDto } from '../dto/ActivitySummaryResponseDto';
import { JwtUserPayload } from '../../auth/decorators/current-user.decorator';
import { UploadedActivityFile } from '../activity-file.constants.js';

const EVENTS_PRIVILEGED_ROLES = ['owner', 'admin', 'reviewer'] as const;
const EDIT_PRIVILEGED_ROLES = ['owner', 'admin', 'reviewer'] as const;

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
    file?: UploadedActivityFile,
  ): Promise<CreateActivityResponseDto> {
    return this.activityRepository.createActivity(authorId, activity, file);
  }

  async updateActivity(
    activityId: string,
    dto: UpdateActivityDto,
    currentUser: JwtUserPayload,
    file?: UploadedActivityFile,
  ): Promise<UpdateActivityResponseDto> {
    const authorId = await this.activityRepository.findOwnerId(activityId);
    if (!authorId) {
      throw new NotFoundException(`Activity with id ${activityId} not found`);
    }

    const isPrivileged =
      typeof currentUser.role === 'string' &&
      (EDIT_PRIVILEGED_ROLES as readonly string[]).includes(currentUser.role);

    if (!isPrivileged && currentUser.sub !== authorId) {
      throw new ForbiddenException(
        'Acesso negado. Apenas o dono da atividade ou owner/admin/reviewer',
      );
    }

    return this.activityRepository.updateActivity(
      activityId,
      dto,
      currentUser.sub,
      file,
    );
  }

  approveActivity(
    id: string,
    actorId: string,
    comment?: string,
  ): Promise<UpdateActivityResponseDto> {
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
  ): Promise<UpdateActivityResponseDto> {
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
  ): Promise<UpdateActivityResponseDto> {
    return this.activityRepository.updateActivityStatus(
      id,
      Status.VERIFIED,
      actorId,
      comment,
    );
  }

  async deleteActivity(
    activityId: string,
    currentUser: JwtUserPayload,
  ): Promise<DeleteActivityResponseDto> {
    const activity =
      await this.activityRepository.findStatusAndOwner(activityId);
    if (!activity) {
      throw new NotFoundException(`Activity with id ${activityId} not found`);
    }

    if (currentUser.role === 'reviewer') {
      throw new ForbiddenException(
        'Acesso negado. Reviewer não pode deletar atividades',
      );
    }

    const isAdminOrOwner =
      currentUser.role === 'owner' || currentUser.role === 'admin';

    if (!isAdminOrOwner) {
      if (currentUser.sub !== activity.authorId) {
        throw new ForbiddenException(
          'Acesso negado. Apenas o autor pode deletar a atividade',
        );
      }
      if ((activity.status ?? Status.PENDING) !== Status.PENDING) {
        throw new BadRequestException(
          'Apenas atividades PENDING podem ser deletadas',
        );
      }
    }

    await this.activityRepository.deleteActivity(activityId);

    return { message: 'Activity deleted successfully' };
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

  async getActivityFile(
    activityId: string,
    currentUser: JwtUserPayload,
  ): Promise<{
    filename: string;
    mimeType: string;
    size: number;
    data: Uint8Array;
  }> {
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

    return this.activityRepository.getFile(activityId);
  }
}
