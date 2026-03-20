import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityTypeResponseDto } from '../dto/ActivityTypeResponseDto';
import { ActivityTypeMapper } from '../mappers/activity-type.mapper';

@Injectable()
export class ActivityTypesRepository {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<ActivityTypeResponseDto[]> {
    const activityTypes = await this.prisma.activity_types.findMany({
      select: {
        id: true,
        cod: true,
        label: true,
        maxHoursInComplementarActivities: true,
        maxHoursPerCertificateOrSemester: true,
        category: true,
        unity: true,
      },
      orderBy: { cod: 'asc' },
    });
    return activityTypes.map(ActivityTypeMapper.toResponseDto);
  }

  async findById(id: string): Promise<ActivityTypeResponseDto | null> {
    const activityType = await this.prisma.activity_types.findUnique({
      where: { id },
      select: {
        id: true,
        cod: true,
        label: true,
        maxHoursInComplementarActivities: true,
        maxHoursPerCertificateOrSemester: true,
        category: true,
        unity: true,
      },
    });
    return activityType
      ? ActivityTypeMapper.toResponseDto(activityType)
      : null;
  }
}
