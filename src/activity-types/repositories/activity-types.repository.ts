import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  ActivityTypeResponseDto,
  CreateActivityTypeResponseDto,
  DeleteActivityTypeResponseDto,
  UpdateActivityTypeResponseDto,
} from '../dto/ActivityTypeResponseDto';
import { ActivityTypeMapper } from '../mappers/activity-type.mapper';
import { CreateActivityTypeDto } from '../dto/CreateActivityTypeDto';
import { UpdateActivityTypeDto } from '../dto/UpdateActivityTypeDto';

@Injectable()
export class ActivityTypesRepository {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<ActivityTypeResponseDto[]> {
    const activityTypes = await this.prisma.activity_types.findMany({
      select: {
        id: true,
        cod: true,
        label: true,
        category: true,
        unity: true,
      },
      orderBy: { cod: 'asc' },
    });
    return activityTypes.map((at) => ActivityTypeMapper.toResponseDto(at));
  }

  async findById(id: string): Promise<ActivityTypeResponseDto | null> {
    const activityType = await this.prisma.activity_types.findUnique({
      where: { id },
      select: {
        id: true,
        cod: true,
        label: true,
        category: true,
        unity: true,
      },
    });
    return activityType ? ActivityTypeMapper.toResponseDto(activityType) : null;
  }

  async create(
    dto: CreateActivityTypeDto,
  ): Promise<CreateActivityTypeResponseDto> {
    const existing = await this.prisma.activity_types.findUnique({
      where: { cod: dto.cod },
    });

    if (existing) {
      throw new ConflictException(
        `Já existe um tipo de atividade com o código '${dto.cod}'`,
      );
    }

    const activityType = await this.prisma.activity_types.create({
      data: {
        cod: dto.cod,
        label: dto.label,
        category: dto.category,
        unity: dto.unity,
      },
    });

    return {
      message: 'Tipo de atividade criado com sucesso',
      activityType: ActivityTypeMapper.toResponseDto(activityType),
    };
  }

  async update(
    id: string,
    dto: UpdateActivityTypeDto,
  ): Promise<UpdateActivityTypeResponseDto> {
    const activityType = await this.prisma.activity_types.findUnique({
      where: { id },
    });

    if (!activityType) {
      throw new NotFoundException(
        `Tipo de atividade com id ${id} não encontrado`,
      );
    }

    if (dto.cod && dto.cod !== activityType.cod) {
      const existing = await this.prisma.activity_types.findUnique({
        where: { cod: dto.cod },
      });

      if (existing) {
        throw new ConflictException(
          `Já existe um tipo de atividade com o código '${dto.cod}'`,
        );
      }
    }

    const updated = await this.prisma.activity_types.update({
      where: { id },
      data: dto,
    });

    return {
      message: 'Tipo de atividade atualizado com sucesso',
      activityType: ActivityTypeMapper.toResponseDto(updated),
    };
  }

  async delete(id: string): Promise<DeleteActivityTypeResponseDto> {
    const activityType = await this.prisma.activity_types.findUnique({
      where: { id },
      include: { activities: { select: { id: true }, take: 1 } },
    });

    if (!activityType) {
      throw new NotFoundException(
        `Tipo de atividade com id ${id} não encontrado`,
      );
    }

    if (activityType.activities.length > 0) {
      throw new BadRequestException(
        'Não é possível deletar um tipo de atividade que possui atividades vinculadas',
      );
    }

    await this.prisma.activity_types.delete({ where: { id } });

    return { message: 'Tipo de atividade deletado com sucesso' };
  }
}
