import { Controller, Get, Param } from '@nestjs/common';
import { ActivityTypesService } from './services/activity-types.service';
import { ActivityTypeResponseDto } from './dto/ActivityTypeResponseDto';

@Controller('activity-types')
export class ActivityTypesController {
  constructor(private activityTypesService: ActivityTypesService) {}

  @Get()
  findAll(): Promise<ActivityTypeResponseDto[]> {
    return this.activityTypesService.getAllActivityTypes();
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<ActivityTypeResponseDto> {
    return this.activityTypesService.getActivityTypeById(id);
  }
}
