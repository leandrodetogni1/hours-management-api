import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateActivityDto } from '../dto/CreateActivityDto';
import { UpdateActivityDto } from '../dto/UpdateActivityDto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Category, CurriculumYear, Prisma, Status } from '@prisma/client';
import {
  ActivityResponseDto,
  CreateActivityResponseDto,
  UpdateActivityResponseDto,
} from '../dto/ActivityResponseDto';
import { ActivityMapper } from '../mappers/activity.mapper';
import { ActivityEventResponseDto } from '../dto/ActivityEventResponseDto';
import { ActivityEventMapper } from '../mappers/activity-event.mapper';
import { ActivitySummaryResponseDto } from '../dto/ActivitySummaryResponseDto';
import {
  SortableActivityField,
  SortOrder,
} from '../dto/ActivitiesListQueryDto';
import { PaginatedActivitiesResponseDto } from '../dto/PaginatedActivitiesResponseDto';
import { calculateHoursEquivalent } from '../domain/hours-calculator.js';
import { calculateActivityProgress } from '../domain/progress-calculator.js';
import { validateStatusTransition } from '../domain/status-transition.js';
import { CurriculaRepository } from '../../curricula/repositories/curricula.repository.js';
import { UploadedActivityFile } from '../activity-file.constants.js';

export interface GetActivitiesOptions {
  authorId?: string;
  status?: Status;
  category?: Category;
  page: number;
  pageSize: number;
  sortBy: SortableActivityField;
  sortOrder: SortOrder;
}

const activityInclude = {
  users: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      picture: true,
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
  file: {
    select: {
      filename: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  },
} as const;

@Injectable()
export class ActivitiesRepository {
  constructor(
    private prisma: PrismaService,
    private curriculaRepository: CurriculaRepository,
  ) {}

  async getAllPaginated(
    options: GetActivitiesOptions,
  ): Promise<PaginatedActivitiesResponseDto> {
    const { authorId, status, category, page, pageSize, sortBy, sortOrder } =
      options;

    const where: Prisma.activitiesWhereInput = {
      ...(authorId && { authorId }),
      ...(status && { status }),
      ...(category && { activity_types: { category } }),
    };

    const orderBy: Prisma.activitiesOrderByWithRelationInput[] = [
      { [sortBy]: sortOrder },
    ];

    const [activities, total] = await this.prisma.$transaction([
      this.prisma.activities.findMany({
        where,
        include: activityInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.activities.count({ where }),
    ]);

    return {
      items: activities.map((a) => ActivityMapper.toResponseDto(a)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
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
    file?: UploadedActivityFile,
  ): Promise<CreateActivityResponseDto> {
    const activityType = await this.prisma.activity_types.findUnique({
      where: { id: dto.activityTypeId },
      select: { id: true, cod: true, unity: true },
    });
    if (!activityType) {
      throw new NotFoundException(
        `Activity type with id ${dto.activityTypeId} not found`,
      );
    }

    const author = await this.prisma.users.findUnique({
      where: { id: authorId },
      select: { id: true, curriculumYear: true },
    });
    if (!author) {
      throw new NotFoundException(`User with id ${authorId} not found`);
    }

    const maxHoursPerCertificateOrSemester =
      await this.resolveMaxHoursPerCertificateOrSemester(
        author.curriculumYear,
        activityType.id,
        activityType.cod,
      );

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
        maxHoursPerCertificateOrSemester,
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

      if (file) {
        await tx.activity_files.create({
          data: {
            activityId: created.id,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            data: new Uint8Array(file.buffer),
          },
        });
      }

      return tx.activities.findUniqueOrThrow({
        where: { id: created.id },
        include: activityInclude,
      });
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
    overrideTransitionRules = false,
  ): Promise<UpdateActivityResponseDto> {
    const activity = await this.prisma.activities.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const currentStatus = activity.status ?? Status.PENDING;
    const transition = validateStatusTransition({
      currentStatus,
      targetStatus: status,
      overrideTransitionRules,
    });

    if (!transition.allowed) {
      throw new BadRequestException(transition.reason);
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

  async updateActivityNote(
    id: string,
    note?: string | null,
  ): Promise<UpdateActivityResponseDto> {
    const existing = await this.prisma.activities.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const value = note?.trim() || null;

    const updated = await this.prisma.activities.update({
      where: { id },
      data: { note: value, noteUpdatedAt: value ? new Date() : null },
      include: activityInclude,
    });

    return {
      message: 'Activity note updated successfully',
      activity: ActivityMapper.toResponseDto(updated),
    };
  }

  async updateActivity(
    id: string,
    dto: UpdateActivityDto,
    actorId: string,
    file?: UploadedActivityFile,
  ): Promise<UpdateActivityResponseDto> {
    if (file && dto.removeFile) {
      throw new BadRequestException(
        'Não é possível enviar um arquivo e remover o arquivo ao mesmo tempo',
      );
    }

    const existing = await this.prisma.activities.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        class: true,
        activityTypeId: true,
        hours: true,
        startDate: true,
        endDate: true,
        authorId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const currentStatus = existing.status ?? Status.PENDING;
    if (currentStatus !== Status.PENDING) {
      throw new BadRequestException(
        `Apenas atividades PENDING podem ser editadas (status atual: ${currentStatus})`,
      );
    }

    const mergedActivityTypeId = dto.activityTypeId ?? existing.activityTypeId;
    if (dto.activityTypeId && dto.activityTypeId !== existing.activityTypeId) {
      const exists = await this.prisma.activity_types.findUnique({
        where: { id: dto.activityTypeId },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundException(
          `Activity type with id ${dto.activityTypeId} not found`,
        );
      }
    }

    const mergedStartDate = dto.startDate ?? existing.startDate;
    const mergedEndDate = dto.endDate ?? existing.endDate;
    if (
      mergedStartDate &&
      mergedEndDate &&
      mergedEndDate.getTime() < mergedStartDate.getTime()
    ) {
      throw new BadRequestException(
        'endDate deve ser maior ou igual a startDate',
      );
    }

    if (!mergedActivityTypeId) {
      throw new BadRequestException(
        'activityTypeId é obrigatório para recalcular as horas equivalentes',
      );
    }

    const activityType = await this.prisma.activity_types.findUnique({
      where: { id: mergedActivityTypeId },
      select: { id: true, cod: true, unity: true },
    });
    if (!activityType) {
      throw new NotFoundException(
        `Activity type with id ${mergedActivityTypeId} not found`,
      );
    }

    let authorCurriculumYear: CurriculumYear | null = null;
    if (existing.authorId) {
      const author = await this.prisma.users.findUnique({
        where: { id: existing.authorId },
        select: { curriculumYear: true },
      });
      authorCurriculumYear = author?.curriculumYear ?? null;
    }

    const maxHoursPerCertificateOrSemester =
      await this.resolveMaxHoursPerCertificateOrSemester(
        authorCurriculumYear,
        activityType.id,
        activityType.cod,
      );

    const mergedClass = dto.class ?? existing.class;
    const mergedHours =
      dto.hours !== undefined
        ? dto.hours
        : (existing.hours?.toNumber() ?? null);

    const hoursEquivalent = calculateHoursEquivalent(
      {
        class: mergedClass,
        startDate: mergedStartDate,
        endDate: mergedEndDate,
        quantity: mergedHours,
      },
      {
        cod: activityType.cod,
        unity: activityType.unity,
        maxHoursPerCertificateOrSemester,
      },
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.activities.update({
        where: { id },
        data: {
          ...(dto.activityTypeId !== undefined && {
            activityTypeId: dto.activityTypeId,
          }),
          ...(dto.class !== undefined && { class: dto.class }),
          ...(dto.event !== undefined && { event: dto.event }),
          ...(dto.organization !== undefined && {
            organization: dto.organization,
          }),
          ...(dto.hours !== undefined && {
            hours: dto.hours != null ? new Prisma.Decimal(dto.hours) : null,
          }),
          hoursEquivalent: new Prisma.Decimal(hoursEquivalent),
          ...(dto.certificateUrl !== undefined && {
            certificateUrl: dto.certificateUrl,
          }),
          ...(dto.startDate !== undefined && { startDate: dto.startDate }),
          ...(dto.endDate !== undefined && { endDate: dto.endDate }),
          updatedAt: new Date(),
        },
      });

      if (file) {
        await tx.activity_files.upsert({
          where: { activityId: id },
          create: {
            activityId: id,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            data: new Uint8Array(file.buffer),
          },
          update: {
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            data: new Uint8Array(file.buffer),
          },
        });
      } else if (dto.removeFile) {
        await tx.activity_files.deleteMany({ where: { activityId: id } });
      }

      await tx.activity_events.create({
        data: {
          activityId: id,
          fromStatus: currentStatus,
          toStatus: currentStatus,
          actorId,
          comment: 'Atividade editada',
        },
      });

      return tx.activities.findUniqueOrThrow({
        where: { id },
        include: activityInclude,
      });
    });

    return {
      message: 'Activity updated successfully',
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

    const curriculumRules = author?.curriculumYear
      ? await this.curriculaRepository.findRulesByYear(author.curriculumYear)
      : null;

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
            curriculumRules: {
              select: { curriculumYear: true, maxHoursTotal: true },
            },
          },
        },
      },
    });

    const progress = calculateActivityProgress({
      curriculumRules,
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

  async findStatusAndOwner(activityId: string): Promise<{
    status: Status | null;
    authorId: string | null;
    event: string | null;
  } | null> {
    return this.prisma.activities.findUnique({
      where: { id: activityId },
      select: { status: true, authorId: true, event: true },
    });
  }

  async findById(activityId: string): Promise<ActivityResponseDto | null> {
    const activity = await this.prisma.activities.findUnique({
      where: { id: activityId },
      include: activityInclude,
    });
    return activity ? ActivityMapper.toResponseDto(activity) : null;
  }

  async deleteActivity(activityId: string): Promise<void> {
    await this.prisma.activities.delete({ where: { id: activityId } });
  }

  async getFile(activityId: string): Promise<{
    filename: string;
    mimeType: string;
    size: number;
    data: Uint8Array;
  }> {
    const file = await this.prisma.activity_files.findUnique({
      where: { activityId },
      select: { filename: true, mimeType: true, size: true, data: true },
    });

    if (!file) {
      throw new NotFoundException(
        `Activity with id ${activityId} has no attached file`,
      );
    }

    return file;
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
            picture: true,
          },
        },
      },
    });

    return events.map((e) => ActivityEventMapper.toResponseDto(e));
  }

  private async resolveMaxHoursPerCertificateOrSemester(
    curriculumYear: CurriculumYear | null,
    activityTypeId: string,
    cod: string,
  ): Promise<number> {
    if (!curriculumYear) {
      throw new UnprocessableEntityException(
        'Usuário não possui currículo definido. Contate o administrador.',
      );
    }

    const rule = await this.curriculaRepository.findActivityTypeRule(
      curriculumYear,
      activityTypeId,
    );
    if (!rule) {
      throw new UnprocessableEntityException(
        `Tipo de atividade '${cod}' não possui regras configuradas para o currículo ${curriculumYear}. Contate o administrador.`,
      );
    }

    return rule.maxHoursPerCertificateOrSemester;
  }
}
