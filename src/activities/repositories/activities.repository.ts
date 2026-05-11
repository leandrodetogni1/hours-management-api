import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateActivityDto } from '../dto/CreateActivityDto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ActivityClass, Category, Prisma, Status } from '@prisma/client';
import {
  ActivityResponseDto,
  CreateActivityResponseDto,
  UpdateActivityStatusResponseDto,
} from '../dto/ActivityResponseDto';
import { ActivityMapper } from '../mappers/activity.mapper';
import { ActivityEventResponseDto } from '../dto/ActivityEventResponseDto';
import { ActivityEventMapper } from '../mappers/activity-event.mapper';
import { ActivitySummaryResponseDto } from '../dto/ActivitySummaryResponseDto';

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
      category: true,
      unity: true,
    },
  },
} as const;

@Injectable()
export class ActivitiesRepository {
  constructor(private prisma: PrismaService) {}

  async getAll(status?: Status): Promise<ActivityResponseDto[]> {
    const activities = await this.prisma.activities.findMany({
      where: status ? { status } : undefined,
      include: activityInclude,
      orderBy: { createdAt: 'desc' },
    });
    return activities.map((a) => ActivityMapper.toResponseDto(a));
  }

  async getByAuthorId(
    authorId: string,
    status?: Status,
  ): Promise<ActivityResponseDto[]> {
    const activities = await this.prisma.activities.findMany({
      where: { authorId, ...(status && { status }) },
      include: activityInclude,
      orderBy: { createdAt: 'desc' },
    });
    return activities.map((a) => ActivityMapper.toResponseDto(a));
  }

  async createActivity(
    authorId: string,
    dto: CreateActivityDto,
  ): Promise<CreateActivityResponseDto> {
    const activityType = await this.prisma.activity_types.findUnique({
      where: { id: dto.activityTypeId },
      select: { id: true },
    });

    if (!activityType) {
      throw new NotFoundException(
        `Activity type with id ${dto.activityTypeId} not found`,
      );
    }

    const author = await this.prisma.users.findUnique({
      where: { id: authorId },
      select: { id: true },
    });

    if (!author) {
      throw new NotFoundException(`User with id ${authorId} not found`);
    }

    const activity = await this.prisma.$transaction(async (tx) => {
      const created = await tx.activities.create({
        data: {
          authorId,
          activityTypeId: dto.activityTypeId,
          class: dto.class,
          event: dto.event,
          organization: dto.organization,
          hours: new Prisma.Decimal(dto.hours),
          startDate: dto.startDate,
          endDate: dto.endDate,
        },
        include: activityInclude,
      });

      await tx.activity_events.create({
        data: {
          activityId: created.id,
          fromStatus: null,
          toStatus: Status.PENDING,
          actorId: authorId,
          comment: null,
        },
      });

      return created;
    });

    return {
      message: 'Activity created successfully',
      activity: ActivityMapper.toResponseDto(activity),
    };
  }

  async updateActivityStatus(
    id: string,
    status: Status,
    actorId: string,
    comment?: string,
  ): Promise<UpdateActivityStatusResponseDto> {
    const activity = await this.prisma.activities.findUnique({
      where: { id },
      select: { status: true },
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.activities.update({
        where: { id },
        data: { status, updatedAt: new Date() },
        include: activityInclude,
      });

      await tx.activity_events.create({
        data: {
          activityId: id,
          fromStatus: currentStatus,
          toStatus: status,
          actorId,
          comment: comment ?? null,
        },
      });

      return result;
    });

    return {
      message: `Activity ${status.toLowerCase()} successfully`,
      activity: ActivityMapper.toResponseDto(updated),
    };
  }

  async getSummaryByAuthorId(
    authorId: string,
  ): Promise<ActivitySummaryResponseDto> {
    const activities = await this.prisma.activities.findMany({
      where: { authorId },
      select: {
        status: true,
        class: true,
        hours: true,
        activity_types: { select: { category: true } },
      },
    });

    const byStatus: Record<Status, { count: number; hours: number }> = {
      [Status.PENDING]: { count: 0, hours: 0 },
      [Status.VERIFIED]: { count: 0, hours: 0 },
      [Status.APPROVED]: { count: 0, hours: 0 },
      [Status.REJECTED]: { count: 0, hours: 0 },
    };
    const approvedHoursByCategory: Record<Category, number> = {
      [Category.ENSINO]: 0,
      [Category.PESQUISA]: 0,
      [Category.EXTENSAO]: 0,
    };
    const approvedHoursByClass: Record<ActivityClass, number> = {
      [ActivityClass.COMPLEMENTAR]: 0,
      [ActivityClass.LIVRE]: 0,
    };

    for (const activity of activities) {
      const status = activity.status ?? Status.PENDING;
      const hours = activity.hours?.toNumber() ?? 0;

      byStatus[status].count += 1;
      byStatus[status].hours += hours;

      if (status === Status.APPROVED) {
        const category = activity.activity_types?.category;
        if (category) {
          approvedHoursByCategory[category] += hours;
        }
        if (activity.class) {
          approvedHoursByClass[activity.class] += hours;
        }
      }
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;
    for (const key of Object.keys(byStatus) as Status[]) {
      byStatus[key].hours = round2(byStatus[key].hours);
    }
    for (const key of Object.keys(approvedHoursByCategory) as Category[]) {
      approvedHoursByCategory[key] = round2(approvedHoursByCategory[key]);
    }
    for (const key of Object.keys(approvedHoursByClass) as ActivityClass[]) {
      approvedHoursByClass[key] = round2(approvedHoursByClass[key]);
    }

    return {
      totalActivities: activities.length,
      totalHoursApproved: byStatus[Status.APPROVED].hours,
      totalHoursInReview: round2(
        byStatus[Status.PENDING].hours + byStatus[Status.VERIFIED].hours,
      ),
      byStatus,
      approvedHoursByCategory,
      approvedHoursByClass,
    };
  }

  async getEvents(activityId: string): Promise<ActivityEventResponseDto[]> {
    const activity = await this.prisma.activities.findUnique({
      where: { id: activityId },
      select: { id: true },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with id ${activityId} not found`);
    }

    const events = await this.prisma.activity_events.findMany({
      where: { activityId },
      orderBy: { createdAt: 'asc' },
    });

    return events.map((e) => ActivityEventMapper.toResponseDto(e));
  }
}
