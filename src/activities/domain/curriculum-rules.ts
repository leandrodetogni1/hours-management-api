import { Course, CurriculumYear } from '@prisma/client';

export interface CurriculumRules {
  curriculumYear: CurriculumYear;
  minHoursPerCategory: number | null;
  minCategoriesRequired: number | null;
  excessToFreeMultiplier: number;
  minFreeHours: number;
  courseRules: Array<{
    course: Course;
    totalMin: number;
    totalMax: number;
  }>;
}
