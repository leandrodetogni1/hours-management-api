import {
  ActivityClass,
  Category,
  Course,
  CurriculumYear,
  Status,
} from '@prisma/client';
import { CurriculumRules } from './curriculum-rules.js';

export interface ProgressActivityType {
  id: string;
  cod: string;
  label: string;
  category: Category | null;
  curriculumRules: Array<{
    curriculumYear: CurriculumYear;
    maxHoursTotal: number;
  }>;
}

export interface ProgressActivity {
  status: Status | null;
  class: ActivityClass | null;
  hoursEquivalent: number;
  activityType: ProgressActivityType | null;
}

export interface ProgressInput {
  curriculumRules: CurriculumRules | null;
  course: Course | null;
  activities: ProgressActivity[];
}

export interface CategoryProgress {
  category: Category;
  hoursAchieved: number;
  minRequired: number | null;
  meetsMinimum: boolean;
}

export interface ComplementaryProgress {
  totalRawHours: number;
  totalCountedHours: number;
  minRequired: number | null;
  maxAccepted: number | null;
  meetsMinimum: boolean;
}

export interface FreeProgress {
  loggedHours: number;
  carriedOverFromComplementary: number;
  totalHours: number;
  minRequired: number;
  meetsMinimum: boolean;
}

export interface CappedType {
  cod: string;
  label: string;
  hoursAchieved: number;
  maxAllowed: number;
}

export interface ActivityProgress {
  totalActivities: number;
  totalHoursApproved: number;
  totalHoursInReview: number;
  byStatus: Record<Status, { count: number; hours: number }>;
  approvedHoursByCategory: Record<Category, number>;
  approvedHoursByClass: Record<ActivityClass, number>;
  categoryProgress: CategoryProgress[];
  complementaryProgress: ComplementaryProgress;
  freeProgress: FreeProgress;
  cappedTypes: CappedType[];
  isReadyToGraduate: boolean;
}

const CATEGORIES: Category[] = [
  Category.ENSINO,
  Category.PESQUISA,
  Category.EXTENSAO,
];

const DEFAULT_MIN_FREE_HOURS = 217;

export function calculateActivityProgress(
  input: ProgressInput,
): ActivityProgress {
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

  const curriculumYear = input.curriculumRules?.curriculumYear ?? null;

  type TypeAgg = {
    cod: string;
    label: string;
    approvedHours: number;
    maxHoursTotal: number | null;
  };
  const byActivityType = new Map<string, TypeAgg>();

  for (const activity of input.activities) {
    const status = activity.status ?? Status.PENDING;
    const hours = activity.hoursEquivalent;

    byStatus[status].count += 1;
    byStatus[status].hours += hours;

    if (status !== Status.APPROVED) continue;

    const category = activity.activityType?.category;
    if (category) approvedHoursByCategory[category] += hours;
    if (activity.class) approvedHoursByClass[activity.class] += hours;

    const type = activity.activityType;
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
            curriculumYear,
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

  const rules = input.curriculumRules;
  const courseRule =
    rules && input.course
      ? (rules.courseRules.find((r) => r.course === input.course) ?? null)
      : null;

  const categoryProgress: CategoryProgress[] = CATEGORIES.map((category) => {
    const hoursAchieved = approvedHoursByCategory[category];
    const minRequired = rules?.minHoursPerCategory ?? null;
    return {
      category,
      hoursAchieved,
      minRequired,
      meetsMinimum: minRequired !== null ? hoursAchieved >= minRequired : false,
    };
  });

  const totalRawComp = approvedHoursByClass[ActivityClass.COMPLEMENTAR];
  const minRequired = courseRule?.totalMin ?? null;
  const maxAccepted = courseRule?.totalMax ?? null;
  const totalCountedComp =
    maxAccepted !== null ? Math.min(totalRawComp, maxAccepted) : totalRawComp;

  const meetsCategoryRule = rules
    ? checkCategoryRule(categoryProgress, rules.minCategoriesRequired)
    : false;
  const meetsTotalMin =
    minRequired !== null ? totalCountedComp >= minRequired : false;
  const complementaryMeetsMinimum = meetsTotalMin && meetsCategoryRule;

  const carriedOverRaw = totalRawComp - totalCountedComp;
  const carriedOver = rules
    ? round2(carriedOverRaw * rules.excessToFreeMultiplier)
    : 0;
  const loggedFree = approvedHoursByClass[ActivityClass.LIVRE];
  const totalFree = round2(loggedFree + carriedOver);
  const minFree = rules?.minFreeHours ?? DEFAULT_MIN_FREE_HOURS;
  const freeMeetsMinimum = totalFree >= minFree;

  const cappedTypes: CappedType[] = [];
  for (const agg of byActivityType.values()) {
    if (agg.maxHoursTotal !== null && agg.approvedHours >= agg.maxHoursTotal) {
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
    totalActivities: input.activities.length,
    totalHoursApproved: byStatus[Status.APPROVED].hours,
    totalHoursInReview: round2(
      byStatus[Status.PENDING].hours + byStatus[Status.VERIFIED].hours,
    ),
    byStatus,
    approvedHoursByCategory,
    approvedHoursByClass,
    categoryProgress,
    complementaryProgress: {
      totalRawHours: round2(totalRawComp),
      totalCountedHours: round2(totalCountedComp),
      minRequired,
      maxAccepted,
      meetsMinimum: complementaryMeetsMinimum,
    },
    freeProgress: {
      loggedHours: round2(loggedFree),
      carriedOverFromComplementary: carriedOver,
      totalHours: totalFree,
      minRequired: minFree,
      meetsMinimum: freeMeetsMinimum,
    },
    cappedTypes,
    isReadyToGraduate: complementaryMeetsMinimum && freeMeetsMinimum,
  };
}

function resolveMaxHoursTotal(
  curriculumYear: CurriculumYear | null,
  curriculumRules: Array<{
    curriculumYear: CurriculumYear;
    maxHoursTotal: number;
  }>,
): number | null {
  if (!curriculumYear) return null;
  const match = curriculumRules.find(
    (r) => r.curriculumYear === curriculumYear,
  );
  return match ? match.maxHoursTotal : null;
}

function checkCategoryRule(
  progress: CategoryProgress[],
  required: number | null,
): boolean {
  if (required === null) return true;
  const passing = progress.filter((p) => p.meetsMinimum).length;
  return passing >= required;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
