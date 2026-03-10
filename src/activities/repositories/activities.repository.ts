import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateActivityDto } from '../dto/CreateActivityDto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
        files: {
          select: {
            id: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createActivity(dto: CreateActivityDto, files: Express.Multer.File[]) {
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

    const activity = await this.prisma.$transaction(async (tx) => {
      const created = await tx.activities.create({
        data: {
          authorId: dto.authorId,
          activityTypeId: dto.activityTypeId,
          category: activityType.category,
          unity: activityType.unity,
          class:
            activityType.category === 'EXTENSAO' ? 'LIVRE' : 'COMPLEMENTAR',
          event: dto.event,
          organization: dto.organization,
          number: dto.number,
          hours: new Prisma.Decimal(dto.hours),
          startDate: dto.startDate,
          endDate: dto.endDate,
        },
      });

      if (files && files.length > 0) {
        await tx.files.createMany({
          data: files.map((file) => ({
            activityId: created.id,
            file: Buffer.from(file.buffer),
          })),
        });
      }

      return tx.activities.findUnique({
        where: { id: created.id },
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
          files: {
            select: {
              id: true,
              updatedAt: true,
            },
          },
        },
      });
    });

    return {
      message: 'Activity created successfully',
      activity,
    };
  }
}
