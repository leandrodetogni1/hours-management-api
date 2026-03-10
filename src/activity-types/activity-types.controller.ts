import { Controller, Get, Param } from '@nestjs/common';
import { ActivityTypesService } from './services/activity-types.service';

@Controller('activity-types')
export class ActivityTypesController {
  constructor(private activityTypesService: ActivityTypesService) {}

  @Get()
  findAll() {
    return this.activityTypesService.getAllActivityTypes();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.activityTypesService.getActivityTypeById(id);
  }
}
