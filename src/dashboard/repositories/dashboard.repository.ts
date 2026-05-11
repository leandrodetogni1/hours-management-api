import { Injectable } from '@nestjs/common';
import { Status, UserSituation } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface StudentWithActivities {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  picture: string | null;
  matricula: string | null;
  situation: UserSituation | null;
  course: import('@prisma/client').Course | null;
  curriculumYear: import('@prisma/client').CurriculumYear | null;
  activities: Array<{
    status: Status | null;
    class: import('@prisma/client').ActivityClass | null;
    hoursEquivalent: { toNumber(): number } | null;
    activity_types: {
      id: string;
      cod: string;
      label: string;
      category: import('@prisma/client').Category | null;
      maxHoursInComplementarActivities: number | null;
      curriculumRules: Array<{
        curriculumYear: import('@prisma/client').CurriculumYear;
        maxHoursTotal: number;
      }>;
    } | null;
  }>;
}

export interface OldestAwaitingActivity {
  id: string;
  event: string | null;
  createdAt: Date;
  authorId: string | null;
  author: { id: string; firstName: string; lastName: string } | null;
}

export interface ReviewQueueData {
  pendingCount: number;
  verifiedCount: number;
  oldestAwaiting: OldestAwaitingActivity | null;
}

export interface SystemStatsData {
  totalUsers: number;
  totalFormandos: number;
  activitiesApprovedLast30Days: number;
  totalActivitiesPending: number;
}

@Injectable()
export class DashboardRepository {
  constructor(private prisma: PrismaService) {}

  async getStudentsWithActivities(
    situations: UserSituation[],
  ): Promise<StudentWithActivities[]> {
    const students = await this.prisma.users.findMany({
      where: {
        situation: { in: situations },
        role: { name: 'member' },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        picture: true,
        matricula: true,
        situation: true,
        course: true,
        curriculumYear: true,
        activities: {
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
        },
      },
    });
    return students;
  }

  async getReviewQueue(): Promise<ReviewQueueData> {
    const [pendingCount, verifiedCount, oldestAwaiting] = await Promise.all([
      this.prisma.activities.count({ where: { status: Status.PENDING } }),
      this.prisma.activities.count({ where: { status: Status.VERIFIED } }),
      this.prisma.activities.findFirst({
        where: { status: { in: [Status.PENDING, Status.VERIFIED] } },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          event: true,
          createdAt: true,
          authorId: true,
          users: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
    ]);

    return {
      pendingCount,
      verifiedCount,
      oldestAwaiting: oldestAwaiting
        ? {
            id: oldestAwaiting.id,
            event: oldestAwaiting.event,
            createdAt: oldestAwaiting.createdAt ?? new Date(),
            authorId: oldestAwaiting.authorId,
            author: oldestAwaiting.users
              ? {
                  id: oldestAwaiting.users.id,
                  firstName: oldestAwaiting.users.firstName,
                  lastName: oldestAwaiting.users.lastName,
                }
              : null,
          }
        : null,
    };
  }

  async getSystemStats(): Promise<SystemStatsData> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

    const [
      totalUsers,
      totalFormandos,
      activitiesApprovedLast30Days,
      totalActivitiesPending,
    ] = await Promise.all([
      this.prisma.users.count({ where: { role: { name: 'member' } } }),
      this.prisma.users.count({
        where: {
          situation: UserSituation.FORMANDO,
          role: { name: 'member' },
        },
      }),
      this.prisma.activities.count({
        where: {
          status: Status.APPROVED,
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.activities.count({ where: { status: Status.PENDING } }),
    ]);

    return {
      totalUsers,
      totalFormandos,
      activitiesApprovedLast30Days,
      totalActivitiesPending,
    };
  }
}
