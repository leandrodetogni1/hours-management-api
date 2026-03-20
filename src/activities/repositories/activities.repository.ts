import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateActivityDto } from '../dto/CreateActivityDto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Status } from '@prisma/client';

@Injectable()
export class ActivitiesRepository {
  constructor(private prisma: PrismaService) {}

  getAll() {
    return this.prisma.activities.findMany({
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        activity_types: {
          select: {
            id: true,
            cod: true,
            label: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createActivity(dto: CreateActivityDto) {
    const activityType = await this.prisma.activity_types.findUnique({
      where: { id: dto.activityTypeId },
    });

    if (!activityType) {
      throw new NotFoundException(
        `Activity type with id ${dto.activityTypeId} not found`,
      );
    }

    const author = await this.prisma.users.findUnique({
      where: { id: dto.authorId },
    });

    if (!author) {
      throw new NotFoundException(`User with id ${dto.authorId} not found`);
    }

    const activity = await this.prisma.activities.create({
      data: {
        authorId: dto.authorId,
        activityTypeId: dto.activityTypeId,
        category: activityType.category,
        unity: activityType.unity,
        class: dto.class,
        event: dto.event,
        organization: dto.organization,
        hours: new Prisma.Decimal(dto.hours),
        startDate: dto.startDate,
        endDate: dto.endDate,
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        activity_types: {
          select: {
            id: true,
            cod: true,
            label: true,
          },
        },
      },
    });

    return {
      message: 'Activity created successfully',
      activity,
    };
  }

  async updateActivityStatus(id: string, status: Status) {
    const activity = await this.prisma.activities.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const updated = await this.prisma.activities.update({
      where: { id },
      data: { status },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        activity_types: {
          select: {
            id: true,
            cod: true,
            label: true,
          },
        },
      },
    });

    return {
      message: `Activity ${status.toLowerCase()} successfully`,
      activity: updated,
    };
  }
}
