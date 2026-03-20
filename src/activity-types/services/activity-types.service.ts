import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityTypesRepository } from '../repositories/activity-types.repository';
import { ActivityTypeResponseDto } from '../dto/ActivityTypeResponseDto';

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
}
