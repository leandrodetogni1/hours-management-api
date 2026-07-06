import { Injectable } from '@nestjs/common';
import { CurriculumYear, UserSituation } from '@prisma/client';
import {
  DashboardRepository,
  StudentWithActivities,
} from '../repositories/dashboard.repository.js';
import {
  AdminDashboardResponseDto,
  FormandoAtRiskDto,
  RegularStudentProgressDto,
} from '../dto/AdminDashboardResponseDto.js';
import {
  calculateActivityProgress,
  ProgressActivity,
} from '../../activities/domain/progress-calculator.js';
import { calculateFormandoGaps } from '../domain/formando-gaps.js';
import { CurriculumRules } from '../../activities/domain/curriculum-rules.js';
import { CurriculaRepository } from '../../curricula/repositories/curricula.repository.js';

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

    const gaps = calculateFormandoGaps(progress, curriculumRules);

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
      complementaryGap: gaps.complementaryGap,
      freeGap: gaps.freeGap,
      totalGap: gaps.totalGap,
      categoryGaps: gaps.categoryGaps,
      blockers: gaps.blockers,
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
