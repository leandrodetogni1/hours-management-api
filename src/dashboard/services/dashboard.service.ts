import { Injectable } from '@nestjs/common';
import { Category, CurriculumYear, UserSituation } from '@prisma/client';
import {
  DashboardRepository,
  StudentWithActivities,
} from '../repositories/dashboard.repository.js';
import {
  AdminDashboardResponseDto,
  CategoryGapDto,
  FormandoAtRiskDto,
  RegularStudentProgressDto,
} from '../dto/AdminDashboardResponseDto.js';
import {
  calculateActivityProgress,
  CategoryProgress,
  ProgressActivity,
} from '../../activities/domain/progress-calculator.js';
import { CurriculumRules } from '../../activities/domain/curriculum-rules.js';
import { CurriculaRepository } from '../../curricula/repositories/curricula.repository.js';

const CATEGORY_LABELS_PT: Record<Category, string> = {
  [Category.ENSINO]: 'Ensino',
  [Category.PESQUISA]: 'Pesquisa',
  [Category.EXTENSAO]: 'Extensão',
};

@Injectable()
export class DashboardService {
  constructor(
    private dashboardRepository: DashboardRepository,
    private curriculaRepository: CurriculaRepository,
  ) {}

  async getAdminDashboard(): Promise<AdminDashboardResponseDto> {
    const [students, reviewQueue, systemStats] = await Promise.all([
      this.dashboardRepository.getStudentsWithActivities([
        UserSituation.FORMANDO,
        UserSituation.REGULAR,
      ]),
      this.dashboardRepository.getReviewQueue(),
      this.dashboardRepository.getSystemStats(),
    ]);

    const curriculumRulesByYear =
      await this.loadCurriculumRulesForStudents(students);

    const formandosAtRisk = students
      .filter((s) => s.situation === UserSituation.FORMANDO)
      .map((s) =>
        this.buildFormandoAtRisk(
          s,
          this.lookupRules(curriculumRulesByYear, s.curriculumYear),
        ),
      )
      .sort((a, b) => b.totalGap - a.totalGap);

    const regularStudentsProgress = students
      .filter((s) => s.situation === UserSituation.REGULAR)
      .map((s) =>
        this.buildRegularStudentProgress(
          s,
          this.lookupRules(curriculumRulesByYear, s.curriculumYear),
        ),
      )
      .sort((a, b) => b.totalHoursApproved - a.totalHoursApproved);

    const now = Date.now();
    return {
      formandosAtRisk,
      regularStudentsProgress,
      reviewQueue: {
        totalAwaiting: reviewQueue.pendingCount + reviewQueue.verifiedCount,
        pendingCount: reviewQueue.pendingCount,
        verifiedCount: reviewQueue.verifiedCount,
        oldestAwaiting: reviewQueue.oldestAwaiting
          ? {
              id: reviewQueue.oldestAwaiting.id,
              event: reviewQueue.oldestAwaiting.event,
              createdAt: reviewQueue.oldestAwaiting.createdAt.toISOString(),
              daysWaiting: Math.floor(
                (now - reviewQueue.oldestAwaiting.createdAt.getTime()) /
                  86_400_000,
              ),
              author: reviewQueue.oldestAwaiting.author ?? {
                id: '',
                firstName: '—',
                lastName: '',
              },
            }
          : null,
      },
      systemStats,
    };
  }

  private async loadCurriculumRulesForStudents(
    students: StudentWithActivities[],
  ): Promise<Map<CurriculumYear, CurriculumRules>> {
    const years = new Set<CurriculumYear>();
    for (const s of students) {
      if (s.curriculumYear) years.add(s.curriculumYear);
    }
    const entries: Array<[CurriculumYear, CurriculumRules]> = [];
    for (const year of years) {
      const rules = await this.curriculaRepository.findRulesByYear(year);
      if (rules) entries.push([year, rules]);
    }
    return new Map(entries);
  }

  private lookupRules(
    map: Map<CurriculumYear, CurriculumRules>,
    year: CurriculumYear | null,
  ): CurriculumRules | null {
    if (!year) return null;
    return map.get(year) ?? null;
  }

  private buildFormandoAtRisk(
    formando: StudentWithActivities,
    curriculumRules: CurriculumRules | null,
  ): FormandoAtRiskDto {
    const progress = calculateActivityProgress({
      curriculumRules,
      course: formando.course,
      activities: formando.activities.map(toProgressActivity),
    });

    const categoryGaps: CategoryGapDto[] = progress.categoryProgress.map(
      (cp) => ({
        category: cp.category,
        achieved: cp.hoursAchieved,
        required: cp.minRequired,
        gap:
          cp.minRequired !== null
            ? Math.max(cp.minRequired - cp.hoursAchieved, 0)
            : 0,
      }),
    );

    const complementaryGap =
      progress.complementaryProgress.minRequired !== null
        ? Math.max(
            progress.complementaryProgress.minRequired -
              progress.complementaryProgress.totalCountedHours,
            0,
          )
        : 0;

    const freeGap = Math.max(
      progress.freeProgress.minRequired - progress.freeProgress.totalHours,
      0,
    );

    const totalGap =
      categoryGaps.reduce((sum, g) => sum + g.gap, 0) +
      complementaryGap +
      freeGap;

    const blockers = buildBlockers(
      complementaryGap,
      freeGap,
      progress.categoryProgress,
    );

    return {
      user: {
        id: formando.id,
        firstName: formando.firstName,
        lastName: formando.lastName,
        email: formando.email,
        picture: formando.picture,
        matricula: formando.matricula,
        course: formando.course,
        curriculumYear: formando.curriculumYear,
      },
      totalHoursApproved: progress.totalHoursApproved,
      complementaryGap: round2(complementaryGap),
      freeGap: round2(freeGap),
      totalGap: round2(totalGap),
      categoryGaps,
      blockers,
      isReadyToGraduate: progress.isReadyToGraduate,
    };
  }

  private buildRegularStudentProgress(
    student: StudentWithActivities,
    curriculumRules: CurriculumRules | null,
  ): RegularStudentProgressDto {
    const progress = calculateActivityProgress({
      curriculumRules,
      course: student.course,
      activities: student.activities.map(toProgressActivity),
    });

    return {
      user: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        picture: student.picture,
        matricula: student.matricula,
        course: student.course,
        curriculumYear: student.curriculumYear,
      },
      totalHoursApproved: progress.totalHoursApproved,
      complementaryHours: progress.approvedHoursByClass.COMPLEMENTAR,
      freeHours: progress.approvedHoursByClass.LIVRE,
      categoryHours: {
        ENSINO: progress.approvedHoursByCategory.ENSINO,
        PESQUISA: progress.approvedHoursByCategory.PESQUISA,
        EXTENSAO: progress.approvedHoursByCategory.EXTENSAO,
      },
    };
  }
}

function toProgressActivity(
  a: StudentWithActivities['activities'][number],
): ProgressActivity {
  return {
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
  };
}

function buildBlockers(
  complementaryGap: number,
  freeGap: number,
  categoryProgress: CategoryProgress[],
): string[] {
  const messages: string[] = [];

  for (const cp of categoryProgress) {
    if (cp.minRequired === null) continue;
    const gap = Math.max(cp.minRequired - cp.hoursAchieved, 0);
    if (gap > 0) {
      messages.push(
        `Faltam ${round2(gap)}h em ${CATEGORY_LABELS_PT[cp.category]}`,
      );
    }
  }

  if (complementaryGap > 0) {
    messages.push(
      `Faltam ${round2(complementaryGap)}h no total de Complementares`,
    );
  }

  if (freeGap > 0) {
    messages.push(`Faltam ${round2(freeGap)}h em Formação Livre`);
  }

  if (messages.length === 0) {
    messages.push('Atende todos os requisitos mínimos');
  }

  return messages;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
