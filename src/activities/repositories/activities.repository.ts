import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateActivityDto } from '../dto/CreateActivityDto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma, Status } from '@prisma/client';
import {
  ActivityResponseDto,
  CreateActivityResponseDto,
  UpdateActivityStatusResponseDto,
} from '../dto/ActivityResponseDto';
import { ActivityMapper } from '../mappers/activity.mapper';

const allowedSourceStatuses: Record<Status, Status[]> = {
  [Status.PENDING]: [],
  [Status.VERIFIED]: [Status.PENDING],
  [Status.APPROVED]: [Status.PENDING, Status.VERIFIED],
  [Status.REJECTED]: [Status.PENDING, Status.VERIFIED],
};

const activityInclude = {
  users: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  activity_types: {
    select: {
      id: true,
      cod: true,
      label: true,
    },
  },
} as const;

@Injectable()
export class ActivitiesRepository {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<ActivityResponseDto[]> {
    const activities = await this.prisma.activities.findMany({
      include: activityInclude,
      orderBy: { createdAt: 'desc' },
    });
    return activities.map(ActivityMapper.toResponseDto);
  }

  async getByAuthorId(authorId: string): Promise<ActivityResponseDto[]> {
    const activities = await this.prisma.activities.findMany({
      where: { authorId },
      include: activityInclude,
      orderBy: { createdAt: 'desc' },
    });
    return activities.map(ActivityMapper.toResponseDto);
  }

  async createActivity(
    authorId: string,
    dto: CreateActivityDto,
  ): Promise<CreateActivityResponseDto> {
    const activityType = await this.prisma.activity_types.findUnique({
      where: { id: dto.activityTypeId },
    });

    if (!activityType) {
      throw new NotFoundException(
        `Activity type with id ${dto.activityTypeId} not found`,
      );
    }

    const author = await this.prisma.users.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      throw new NotFoundException(`User with id ${authorId} not found`);
    }

    const activity = await this.prisma.activities.create({
      data: {
        authorId,
        activityTypeId: dto.activityTypeId,
        category: activityType.category,
        unity: activityType.unity,
        class: dto.class,
        event: dto.event,
        organization: dto.organization,
        hours: new Prisma.Decimal(dto.hours),
        startDate: dto.startDate,
        endDate: dto.endDate,
      },
      include: activityInclude,
    });

    return {
      message: 'Activity created successfully',
      activity: ActivityMapper.toResponseDto(activity),
    };
  }

  async updateActivityStatus(
    id: string,
    status: Status,
  ): Promise<UpdateActivityStatusResponseDto> {
    const activity = await this.prisma.activities.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const currentStatus = activity.status ?? Status.PENDING;
    const allowedSources = allowedSourceStatuses[status];

    if (!allowedSources.includes(currentStatus)) {
      throw new BadRequestException(
        `Não é possível alterar o status de ${currentStatus} para ${status}`,
      );
    }

    const updated = await this.prisma.activities.update({
      where: { id },
      data: { status },
      include: activityInclude,
    });

    return {
      message: `Activity ${status.toLowerCase()} successfully`,
      activity: ActivityMapper.toResponseDto(updated),
    };
  }
}
