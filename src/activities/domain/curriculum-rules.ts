import { Course, CurriculumYear } from '@prisma/client';

export interface CurriculumRules {
  minHoursPerCategory: number | null;
  minCategoriesRequired: 2 | 3 | null;
  totalMinByCourse: Partial<Record<Course, number>>;
  totalMaxByCourse: Partial<Record<Course, number>>;
  excessToFreeMultiplier: number;
  minFreeHours: number;
}

export const CURRICULUM_RULES: Record<CurriculumYear, CurriculumRules> = {
  Y2012: {
    minHoursPerCategory: null,
    minCategoriesRequired: null,
    totalMinByCourse: {},
    totalMaxByCourse: {
      [Course.ENGENHARIA_DA_COMPUTACAO]: 340,
    },
    excessToFreeMultiplier: 1,
    minFreeHours: 217,
  },
  Y2013: {
    minHoursPerCategory: 100,
    minCategoriesRequired: 3,
    totalMinByCourse: {},
    totalMaxByCourse: {},
    excessToFreeMultiplier: 5 / 6,
    minFreeHours: 217,
  },
  Y2015: {
    minHoursPerCategory: 120,
    minCategoriesRequired: 2,
    totalMinByCourse: {
      [Course.ENGENHARIA_DA_COMPUTACAO]: 315,
      [Course.CIENCIA_DA_COMPUTACAO]: 320,
    },
    totalMaxByCourse: {
      [Course.ENGENHARIA_DA_COMPUTACAO]: 315,
      [Course.CIENCIA_DA_COMPUTACAO]: 320,
    },
    excessToFreeMultiplier: 1,
    minFreeHours: 217,
  },
};

export function resolveMaxHoursTotal(
  defaultCap: number | null,
  curriculumYear: CurriculumYear | null,
  curriculumOverrides: Array<{
    curriculumYear: CurriculumYear;
    maxHoursTotal: number;
  }>,
): number | null {
  if (!curriculumYear) return defaultCap;
  const override = curriculumOverrides.find(
    (r) => r.curriculumYear === curriculumYear,
  );
  return override ? override.maxHoursTotal : defaultCap;
}
