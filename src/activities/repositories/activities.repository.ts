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
import { ActivityEventResponseDto } from '../dto/ActivityEventResponseDto';
import { ActivityEventMapper } from '../mappers/activity-event.mapper';
import { ActivitySummaryResponseDto } from '../dto/ActivitySummaryResponseDto';
import { calculateHoursEquivalent } from '../domain/hours-calculator.js';
import { calculateActivityProgress } from '../domain/progress-calculator.js';

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
      select: {
        id: true,
        cod: true,
        unity: true,
        maxHoursPerCertificateOrSemester: true,
      },
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

    const hoursEquivalent = calculateHoursEquivalent(
      {
        class: dto.class,
        startDate: dto.startDate,
        endDate: dto.endDate,
        quantity: dto.hours ?? null,
      },
      {
        cod: activityType.cod,
        unity: activityType.unity,
        maxHoursPerCertificateOrSemester:
          activityType.maxHoursPerCertificateOrSemester,
      },
    );

    const activity = await this.prisma.$transaction(async (tx) => {
      const created = await tx.activities.create({
        data: {
          authorId,
          activityTypeId: dto.activityTypeId,
          class: dto.class,
          event: dto.event,
          organization: dto.organization,
          hours: dto.hours != null ? new Prisma.Decimal(dto.hours) : null,
          hoursEquivalent: new Prisma.Decimal(hoursEquivalent),
          certificateUrl: dto.certificateUrl ?? null,
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
    const author = await this.prisma.users.findUnique({
      where: { id: authorId },
      select: { curriculumYear: true, course: true },
    });

    const activities = await this.prisma.activities.findMany({
      where: { authorId },
      select: {
        status: true,
        class: true,
        hoursEquivalent: true,
        activity_types: {
          select: {
            id: true,
            cod: true,
            label: true,
            category: true,
            maxHoursInComplementarActivities: true,
            curriculumRules: {
              select: { curriculumYear: true, maxHoursTotal: true },
            },
          },
        },
      },
    });

    const progress = calculateActivityProgress({
      curriculumYear: author?.curriculumYear ?? null,
      course: author?.course ?? null,
      activities: activities.map((a) => ({
        status: a.status,
        class: a.class,
        hoursEquivalent: a.hoursEquivalent?.toNumber() ?? 0,
        activityType: a.activity_types
          ? {
              id: a.activity_types.id,
              cod: a.activity_types.cod,
              label: a.activity_types.label,
              category: a.activity_types.category,
              maxHoursInComplementarActivities:
                a.activity_types.maxHoursInComplementarActivities,
              curriculumRules: a.activity_types.curriculumRules,
            }
          : null,
      })),
    });

    return {
      totalActivities: progress.totalActivities,
      totalHoursApproved: progress.totalHoursApproved,
      totalHoursInReview: progress.totalHoursInReview,
      byStatus: progress.byStatus,
      approvedHoursByCategory: progress.approvedHoursByCategory,
      approvedHoursByClass: progress.approvedHoursByClass,
      curriculum: {
        curriculumYear: author?.curriculumYear ?? null,
        course: author?.course ?? null,
      },
      categoryProgress: progress.categoryProgress,
      complementaryProgress: progress.complementaryProgress,
      freeProgress: progress.freeProgress,
      cappedTypes: progress.cappedTypes,
    };
  }

  async findOwnerId(activityId: string): Promise<string | null> {
    const activity = await this.prisma.activities.findUnique({
      where: { id: activityId },
      select: { authorId: true },
    });
    return activity?.authorId ?? null;
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
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return events.map((e) => ActivityEventMapper.toResponseDto(e));
  }
}
