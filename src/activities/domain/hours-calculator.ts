import { ActivityClass, Unity } from '@prisma/client';

export interface ActivityHoursInput {
  class: ActivityClass | null;
  startDate: Date | null;
  endDate: Date | null;
  quantity: number | null;
}

export interface ActivityTypeRules {
  cod: string;
  unity: Unity | null;
  maxHoursPerCertificateOrSemester: number | null;
}

type CalculationStrategy = 'semester-rate' | 'hours-capped' | 'per-occurrence';

const SEMESTER_RATE_CODES = new Set(['A', 'B', 'C', 'D', 'J']);
const HOURS_CAPPED_CODES = new Set(['E', 'F', 'G', 'L']);

function calculationStrategyFor(cod: string): CalculationStrategy {
  if (SEMESTER_RATE_CODES.has(cod)) return 'semester-rate';
  if (HOURS_CAPPED_CODES.has(cod)) return 'hours-capped';
  return 'per-occurrence';
}

export function calculateHoursEquivalent(
  input: ActivityHoursInput,
  type: ActivityTypeRules,
): number {
  const maxPerCert = type.maxHoursPerCertificateOrSemester ?? 0;
  const intermediate = computeIntermediate(input, type, maxPerCert);

  if (input.class === ActivityClass.LIVRE) {
    return round2(intermediate);
  }

  switch (calculationStrategyFor(type.cod)) {
    case 'hours-capped':
      return round2(Math.min(intermediate, maxPerCert));
    case 'semester-rate':
      return round2(intermediate * maxPerCert);
    case 'per-occurrence':
      return intermediate > 0 ? round2(maxPerCert) : 0;
  }
}

function computeIntermediate(
  input: ActivityHoursInput,
  type: ActivityTypeRules,
  maxPerCert: number,
): number {
  if (type.unity === Unity.SEMESTRE) {
    if (!input.startDate || !input.endDate) return 0;
    const semesters = semestersBetween(input.startDate, input.endDate);
    return input.class === ActivityClass.COMPLEMENTAR
      ? semesters
      : semesters * maxPerCert;
  }

  return input.quantity ?? 0;
}

export function semestersBetween(start: Date, end: Date): number {
  const fullMonths = monthsBetween(start, end);
  const residualDays = daysAfterMonthAnniversary(start, end, fullMonths);
  const roundsUp = residualDays + 1 >= 15 ? 1 : 0;
  return (fullMonths + roundsUp) / 6;
}

function monthsBetween(start: Date, end: Date): number {
  const raw =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  const adjusted = end.getUTCDate() < start.getUTCDate() ? raw - 1 : raw;
  return Math.max(adjusted, 0);
}

function daysAfterMonthAnniversary(
  start: Date,
  end: Date,
  fullMonths: number,
): number {
  const anniversary = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth() + fullMonths,
      start.getUTCDate(),
    ),
  );
  const millisPerDay = 86_400_000;
  return Math.floor((end.getTime() - anniversary.getTime()) / millisPerDay);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
