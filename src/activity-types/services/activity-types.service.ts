import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityTypesRepository } from '../repositories/activity-types.repository';

@Injectable()
export class ActivityTypesService {
  constructor(private activityTypesRepository: ActivityTypesRepository) {}

  getAllActivityTypes() {
    return this.activityTypesRepository.getAll();
  }

  async getActivityTypeById(id: string) {
    const activityType = await this.activityTypesRepository.findById(id);
    if (!activityType) {
      throw new NotFoundException(`Activity type with id ${id} not found`);
    }
    return activityType;
  }
}
