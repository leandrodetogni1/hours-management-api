import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityTypesRepository } from '../repositories/activity-types.repository';
import {
  ActivityTypeResponseDto,
  CreateActivityTypeResponseDto,
  DeleteActivityTypeResponseDto,
  UpdateActivityTypeResponseDto,
} from '../dto/ActivityTypeResponseDto';
import { CreateActivityTypeDto } from '../dto/CreateActivityTypeDto';
import { UpdateActivityTypeDto } from '../dto/UpdateActivityTypeDto';

@Injectable()
export class ActivityTypesService {
  constructor(private activityTypesRepository: ActivityTypesRepository) {}

  getAllActivityTypes(): Promise<ActivityTypeResponseDto[]> {
    return this.activityTypesRepository.getAll();
  }

  async getActivityTypeById(id: string): Promise<ActivityTypeResponseDto> {
    const activityType = await this.activityTypesRepository.findById(id);
    if (!activityType) {
      throw new NotFoundException(`Activity type with id ${id} not found`);
    }
    return activityType;
  }

  createActivityType(
    dto: CreateActivityTypeDto,
  ): Promise<CreateActivityTypeResponseDto> {
    return this.activityTypesRepository.create(dto);
  }

  updateActivityType(
    id: string,
    dto: UpdateActivityTypeDto,
  ): Promise<UpdateActivityTypeResponseDto> {
    return this.activityTypesRepository.update(id, dto);
  }

  deleteActivityType(id: string): Promise<DeleteActivityTypeResponseDto> {
    return this.activityTypesRepository.delete(id);
  }
}
