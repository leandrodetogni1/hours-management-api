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

  async createActivity(
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
      where: { id: dto.authorId },
    });

    if (!author) {
      throw new NotFoundException(`User with id ${dto.authorId} not found`);
    }

    const activity = await this.prisma.activities.create({
      data: {
        authorId: dto.authorId,
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

    if (activity.status !== Status.PENDING) {
      throw new BadRequestException(
        'Apenas atividades com status pendente podem ser aprovadas ou rejeitadas',
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
