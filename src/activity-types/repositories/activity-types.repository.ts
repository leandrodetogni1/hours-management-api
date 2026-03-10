import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ActivityTypesRepository {
  constructor(private prisma: PrismaService) {}

  getAll() {
    return this.prisma.activity_types.findMany({
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
  }

  findById(id: string) {
    return this.prisma.activity_types.findUnique({
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
  }
}
