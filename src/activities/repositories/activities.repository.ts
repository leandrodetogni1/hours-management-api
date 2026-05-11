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
import {
  ActivitySummaryResponseDto,
  CappedTypeWarningDto,
  CategoryProgressDto,
} from '../dto/ActivitySummaryResponseDto';
import { calculateHoursEquivalent } from '../domain/hours-calculator.js';
import {
  CURRICULUM_RULES,
  resolveMaxHoursTotal,
} from '../domain/curriculum-rules.js';

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

    const round2 = (n: number) => Math.round(n * 100) / 100;

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

    type TypeAgg = {
      cod: string;
      label: string;
      approvedHours: number;
      maxHoursTotal: number | null;
    };
    const byActivityType = new Map<string, TypeAgg>();

    for (const activity of activities) {
      const status = activity.status ?? Status.PENDING;
      const hours = activity.hoursEquivalent?.toNumber() ?? 0;

      byStatus[status].count += 1;
      byStatus[status].hours += hours;

      if (status !== Status.APPROVED) continue;

      const category = activity.activity_types?.category;
      if (category) approvedHoursByCategory[category] += hours;
      if (activity.class) approvedHoursByClass[activity.class] += hours;

      const type = activity.activity_types;
      if (type) {
        const existing = byActivityType.get(type.id);
        if (existing) {
          existing.approvedHours += hours;
        } else {
          byActivityType.set(type.id, {
            cod: type.cod,
            label: type.label,
            approvedHours: hours,
            maxHoursTotal: resolveMaxHoursTotal(
              type.maxHoursInComplementarActivities,
              author?.curriculumYear ?? null,
              type.curriculumRules,
            ),
          });
        }
      }
    }

    for (const key of Object.keys(byStatus) as Status[]) {
      byStatus[key].hours = round2(byStatus[key].hours);
    }
    for (const key of Object.keys(approvedHoursByCategory) as Category[]) {
      approvedHoursByCategory[key] = round2(approvedHoursByCategory[key]);
    }
    for (const key of Object.keys(approvedHoursByClass) as ActivityClass[]) {
      approvedHoursByClass[key] = round2(approvedHoursByClass[key]);
    }

    const curriculumYear = author?.curriculumYear ?? null;
    const course = author?.course ?? null;
    const rules = curriculumYear ? CURRICULUM_RULES[curriculumYear] : null;

    const categoryProgress: CategoryProgressDto[] = (
      [Category.ENSINO, Category.PESQUISA, Category.EXTENSAO] as Category[]
    ).map((category) => {
      const hoursAchieved = approvedHoursByCategory[category];
      const minRequired = rules?.minHoursPerCategory ?? null;
      return {
        category,
        hoursAchieved,
        minRequired,
        meetsMinimum:
          minRequired !== null ? hoursAchieved >= minRequired : false,
      };
    });

    const totalRawComp = approvedHoursByClass[ActivityClass.COMPLEMENTAR];
    const minRequired =
      rules && course ? (rules.totalMinByCourse[course] ?? null) : null;
    const maxAccepted =
      rules && course ? (rules.totalMaxByCourse[course] ?? null) : null;
    const totalCountedComp =
      maxAccepted !== null ? Math.min(totalRawComp, maxAccepted) : totalRawComp;

    const meetsCategoryRule = rules
      ? this.checkCategoryRule(categoryProgress, rules.minCategoriesRequired)
      : false;
    const meetsTotalMin =
      minRequired !== null ? totalCountedComp >= minRequired : false;

    const carriedOverRaw = totalRawComp - totalCountedComp;
    const carriedOver = rules
      ? round2(carriedOverRaw * rules.excessToFreeMultiplier)
      : 0;
    const loggedFree = approvedHoursByClass[ActivityClass.LIVRE];
    const totalFree = round2(loggedFree + carriedOver);
    const minFree = rules?.minFreeHours ?? 217;

    const cappedTypes: CappedTypeWarningDto[] = [];
    for (const agg of byActivityType.values()) {
      if (
        agg.maxHoursTotal !== null &&
        agg.approvedHours >= agg.maxHoursTotal
      ) {
        cappedTypes.push({
          cod: agg.cod,
          label: agg.label,
          hoursAchieved: round2(agg.approvedHours),
          maxAllowed: agg.maxHoursTotal,
        });
      }
    }
    cappedTypes.sort((a, b) => a.cod.localeCompare(b.cod));

    return {
      totalActivities: activities.length,
      totalHoursApproved: byStatus[Status.APPROVED].hours,
      totalHoursInReview: round2(
        byStatus[Status.PENDING].hours + byStatus[Status.VERIFIED].hours,
      ),
      byStatus,
      approvedHoursByCategory,
      approvedHoursByClass,
      curriculum: { curriculumYear, course },
      categoryProgress,
      complementaryProgress: {
        totalRawHours: round2(totalRawComp),
        totalCountedHours: round2(totalCountedComp),
        minRequired,
        maxAccepted,
        meetsMinimum: meetsTotalMin && meetsCategoryRule,
      },
      freeProgress: {
        loggedHours: round2(loggedFree),
        carriedOverFromComplementary: carriedOver,
        totalHours: totalFree,
        minRequired: minFree,
        meetsMinimum: totalFree >= minFree,
      },
      cappedTypes,
    };
  }

  private checkCategoryRule(
    progress: CategoryProgressDto[],
    required: 2 | 3 | null,
  ): boolean {
    if (required === null) return true;
    const passing = progress.filter((p) => p.meetsMinimum).length;
    return passing >= required;
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
