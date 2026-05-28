import { Course, CurriculumYear } from '@prisma/client';
import {
  CurriculumActivityTypeRuleDto,
  CurriculumCourseRuleDto,
  CurriculumResponseDto,
  CurriculumSummaryDto,
} from '../dto/CurriculumResponseDto';
import { CurriculumRules } from '../../activities/domain/curriculum-rules.js';

type DecimalLike = { toNumber(): number } | number;

interface CurriculumRowSummary {
  year: CurriculumYear;
  minHoursPerCategory: number | null;
  minCategoriesRequired: number | null;
  excessToFreeMultiplier: DecimalLike;
  minFreeHours: number;
}

interface CourseRuleRow {
  course: Course;
  totalMin: number;
  totalMax: number;
}

interface ActivityTypeRuleRow {
  maxHoursTotal: number;
  maxHoursPerCertificateOrSemester: number;
  activityType: { cod: string; label: string };
}

interface CurriculumRow extends CurriculumRowSummary {
  courseRules: CourseRuleRow[];
  activityTypeRules: ActivityTypeRuleRow[];
}

function toNumber(value: DecimalLike): number {
  return typeof value === 'number' ? value : value.toNumber();
}

export class CurriculumMapper {
  static toSummaryDto(row: CurriculumRowSummary): CurriculumSummaryDto {
    return {
      year: row.year,
      minHoursPerCategory: row.minHoursPerCategory,
      minCategoriesRequired: row.minCategoriesRequired,
      excessToFreeMultiplier: toNumber(row.excessToFreeMultiplier),
      minFreeHours: row.minFreeHours,
    };
  }

  static toResponseDto(row: CurriculumRow): CurriculumResponseDto {
    return {
      ...CurriculumMapper.toSummaryDto(row),
      courseRules: row.courseRules
        .map((cr) => CurriculumMapper.toCourseRuleDto(cr))
        .sort((a, b) => a.course.localeCompare(b.course)),
      activityTypeRules: row.activityTypeRules
        .map((atr) => CurriculumMapper.toActivityTypeRuleDto(atr))
        .sort((a, b) => a.cod.localeCompare(b.cod)),
    };
  }

  static toCourseRuleDto(row: CourseRuleRow): CurriculumCourseRuleDto {
    return {
      course: row.course,
      totalMin: row.totalMin,
      totalMax: row.totalMax,
    };
  }

  static toActivityTypeRuleDto(
    row: ActivityTypeRuleRow,
  ): CurriculumActivityTypeRuleDto {
    return {
      cod: row.activityType.cod,
      label: row.activityType.label,
      maxHoursTotal: row.maxHoursTotal,
      maxHoursPerCertificateOrSemester: row.maxHoursPerCertificateOrSemester,
    };
  }

  static toCurriculumRules(row: CurriculumRow): CurriculumRules {
    return {
      curriculumYear: row.year,
      minHoursPerCategory: row.minHoursPerCategory,
      minCategoriesRequired: row.minCategoriesRequired,
      excessToFreeMultiplier: toNumber(row.excessToFreeMultiplier),
      minFreeHours: row.minFreeHours,
      courseRules: row.courseRules.map((cr) => ({
        course: cr.course,
        totalMin: cr.totalMin,
        totalMax: cr.totalMax,
      })),
    };
  }
}
