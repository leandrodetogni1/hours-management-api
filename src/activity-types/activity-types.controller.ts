import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ActivityTypesService } from './services/activity-types.service';
import {
  ActivityTypeResponseDto,
  CreateActivityTypeResponseDto,
  UpdateActivityTypeResponseDto,
} from './dto/ActivityTypeResponseDto';
import { CreateActivityTypeDto } from './dto/CreateActivityTypeDto';
import { UpdateActivityTypeDto } from './dto/UpdateActivityTypeDto';

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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() body: CreateActivityTypeDto,
  ): Promise<CreateActivityTypeResponseDto> {
    return this.activityTypesService.createActivityType(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateActivityTypeDto,
  ): Promise<UpdateActivityTypeResponseDto> {
    return this.activityTypesService.updateActivityType(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.activityTypesService.deleteActivityType(id);
  }
}
