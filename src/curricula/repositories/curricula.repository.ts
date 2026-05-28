import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Course, CurriculumYear, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CurriculumRules } from '../../activities/domain/curriculum-rules.js';
import { CurriculumMapper } from '../mappers/curriculum.mapper';
import {
  CurriculumActivityTypeRuleDto,
  CurriculumCourseRuleDto,
  CurriculumResponseDto,
  CurriculumSummaryDto,
} from '../dto/CurriculumResponseDto';
import { CreateCurriculumDto } from '../dto/CreateCurriculumDto';
import { UpdateCurriculumDto } from '../dto/UpdateCurriculumDto';
import { UpsertCourseRuleDto } from '../dto/UpsertCourseRuleDto';
import { UpsertActivityTypeRuleDto } from '../dto/UpsertActivityTypeRuleDto';

const fullInclude = {
  courseRules: true,
  activityTypeRules: {
    include: {
      activityType: { select: { cod: true, label: true } },
    },
  },
} as const;

@Injectable()
export class CurriculaRepository {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<CurriculumSummaryDto[]> {
    const rows = await this.prisma.curricula.findMany({
      orderBy: { year: 'asc' },
    });
    return rows.map((r) => CurriculumMapper.toSummaryDto(r));
  }

  async findByYear(
    year: CurriculumYear,
  ): Promise<CurriculumResponseDto | null> {
    const row = await this.prisma.curricula.findUnique({
      where: { year },
      include: fullInclude,
    });
    return row ? CurriculumMapper.toResponseDto(row) : null;
  }

  async findRulesByYear(year: CurriculumYear): Promise<CurriculumRules | null> {
    const row = await this.prisma.curricula.findUnique({
      where: { year },
      include: fullInclude,
    });
    return row ? CurriculumMapper.toCurriculumRules(row) : null;
  }

  async findActivityTypeRule(
    year: CurriculumYear,
    activityTypeId: string,
  ): Promise<{
    maxHoursTotal: number;
    maxHoursPerCertificateOrSemester: number;
  } | null> {
    const row = await this.prisma.activity_type_curriculum_rules.findUnique({
      where: {
        activityTypeId_curriculumYear: {
          activityTypeId,
          curriculumYear: year,
        },
      },
      select: {
        maxHoursTotal: true,
        maxHoursPerCertificateOrSemester: true,
      },
    });
    return row;
  }

  async create(dto: CreateCurriculumDto): Promise<CurriculumResponseDto> {
    const existing = await this.prisma.curricula.findUnique({
      where: { year: dto.year },
    });
    if (existing) {
      throw new ConflictException(
        `Currículo ${dto.year} já existe. Use PATCH para atualizar.`,
      );
    }

    if (dto.minCategoriesRequired === undefined && dto.minHoursPerCategory) {
      throw new BadRequestException(
        'minCategoriesRequired é obrigatório quando minHoursPerCategory está definido',
      );
    }

    const row = await this.prisma.curricula.create({
      data: {
        year: dto.year,
        minHoursPerCategory: dto.minHoursPerCategory ?? null,
        minCategoriesRequired: dto.minCategoriesRequired ?? null,
        excessToFreeMultiplier: new Prisma.Decimal(dto.excessToFreeMultiplier),
        minFreeHours: dto.minFreeHours,
      },
      include: fullInclude,
    });

    return CurriculumMapper.toResponseDto(row);
  }

  async update(
    year: CurriculumYear,
    dto: UpdateCurriculumDto,
  ): Promise<CurriculumResponseDto> {
    const existing = await this.prisma.curricula.findUnique({
      where: { year },
    });
    if (!existing) {
      throw new NotFoundException(`Currículo ${year} não encontrado`);
    }

    const data: Prisma.curriculaUpdateInput = {};
    if (dto.minHoursPerCategory !== undefined) {
      data.minHoursPerCategory = dto.minHoursPerCategory;
    }
    if (dto.minCategoriesRequired !== undefined) {
      data.minCategoriesRequired = dto.minCategoriesRequired;
    }
    if (dto.excessToFreeMultiplier !== undefined) {
      data.excessToFreeMultiplier = new Prisma.Decimal(
        dto.excessToFreeMultiplier,
      );
    }
    if (dto.minFreeHours !== undefined) {
      data.minFreeHours = dto.minFreeHours;
    }

    const row = await this.prisma.curricula.update({
      where: { year },
      data,
      include: fullInclude,
    });

    return CurriculumMapper.toResponseDto(row);
  }

  async delete(year: CurriculumYear): Promise<void> {
    const existing = await this.prisma.curricula.findUnique({
      where: { year },
      select: { year: true },
    });
    if (!existing) {
      throw new NotFoundException(`Currículo ${year} não encontrado`);
    }

    const usersUsing = await this.prisma.users.count({
      where: { curriculumYear: year },
    });
    if (usersUsing > 0) {
      throw new BadRequestException(
        `Não é possível remover o currículo ${year} (${usersUsing} usuário(s) atribuído(s))`,
      );
    }

    await this.prisma.curricula.delete({ where: { year } });
  }

  async upsertCourseRule(
    year: CurriculumYear,
    course: Course,
    dto: UpsertCourseRuleDto,
  ): Promise<CurriculumCourseRuleDto> {
    if (dto.totalMin > dto.totalMax) {
      throw new BadRequestException(
        'totalMin deve ser menor ou igual a totalMax',
      );
    }

    const curriculum = await this.prisma.curricula.findUnique({
      where: { year },
      select: { year: true },
    });
    if (!curriculum) {
      throw new NotFoundException(`Currículo ${year} não encontrado`);
    }

    const row = await this.prisma.curriculum_course_rules.upsert({
      where: { curriculumYear_course: { curriculumYear: year, course } },
      update: { totalMin: dto.totalMin, totalMax: dto.totalMax },
      create: {
        curriculumYear: year,
        course,
        totalMin: dto.totalMin,
        totalMax: dto.totalMax,
      },
    });

    return CurriculumMapper.toCourseRuleDto(row);
  }

  async deleteCourseRule(year: CurriculumYear, course: Course): Promise<void> {
    const existing = await this.prisma.curriculum_course_rules.findUnique({
      where: { curriculumYear_course: { curriculumYear: year, course } },
    });
    if (!existing) {
      throw new NotFoundException(
        `Regra de curso ${course} para o currículo ${year} não encontrada`,
      );
    }
    await this.prisma.curriculum_course_rules.delete({
      where: { curriculumYear_course: { curriculumYear: year, course } },
    });
  }

  async upsertActivityTypeRule(
    year: CurriculumYear,
    cod: string,
    dto: UpsertActivityTypeRuleDto,
  ): Promise<CurriculumActivityTypeRuleDto> {
    if (dto.maxHoursPerCertificateOrSemester > dto.maxHoursTotal) {
      throw new BadRequestException(
        'maxHoursPerCertificateOrSemester não pode ser maior que maxHoursTotal',
      );
    }

    const curriculum = await this.prisma.curricula.findUnique({
      where: { year },
      select: { year: true },
    });
    if (!curriculum) {
      throw new NotFoundException(`Currículo ${year} não encontrado`);
    }

    const activityType = await this.prisma.activity_types.findUnique({
      where: { cod },
      select: { id: true, cod: true, label: true },
    });
    if (!activityType) {
      throw new NotFoundException(
        `Tipo de atividade com código '${cod}' não encontrado`,
      );
    }

    const row = await this.prisma.activity_type_curriculum_rules.upsert({
      where: {
        activityTypeId_curriculumYear: {
          activityTypeId: activityType.id,
          curriculumYear: year,
        },
      },
      update: {
        maxHoursTotal: dto.maxHoursTotal,
        maxHoursPerCertificateOrSemester: dto.maxHoursPerCertificateOrSemester,
      },
      create: {
        activityTypeId: activityType.id,
        curriculumYear: year,
        maxHoursTotal: dto.maxHoursTotal,
        maxHoursPerCertificateOrSemester: dto.maxHoursPerCertificateOrSemester,
      },
    });

    return CurriculumMapper.toActivityTypeRuleDto({
      maxHoursTotal: row.maxHoursTotal,
      maxHoursPerCertificateOrSemester: row.maxHoursPerCertificateOrSemester,
      activityType: { cod: activityType.cod, label: activityType.label },
    });
  }

  async deleteActivityTypeRule(
    year: CurriculumYear,
    cod: string,
  ): Promise<void> {
    const activityType = await this.prisma.activity_types.findUnique({
      where: { cod },
      select: { id: true },
    });
    if (!activityType) {
      throw new NotFoundException(
        `Tipo de atividade com código '${cod}' não encontrado`,
      );
    }

    const existing =
      await this.prisma.activity_type_curriculum_rules.findUnique({
        where: {
          activityTypeId_curriculumYear: {
            activityTypeId: activityType.id,
            curriculumYear: year,
          },
        },
      });
    if (!existing) {
      throw new NotFoundException(
        `Regra para o tipo '${cod}' no currículo ${year} não encontrada`,
      );
    }

    await this.prisma.activity_type_curriculum_rules.delete({
      where: {
        activityTypeId_curriculumYear: {
          activityTypeId: activityType.id,
          curriculumYear: year,
        },
      },
    });
  }
}
