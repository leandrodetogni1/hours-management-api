import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ActivitiesService } from './services/activities.service';
import { CreateActivityDto } from './dto/CreateActivityDto';
import {
  ActivityResponseDto,
  CreateActivityResponseDto,
  UpdateActivityStatusResponseDto,
} from './dto/ActivityResponseDto';

@Controller('activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  findAll(): Promise<ActivityResponseDto[]> {
    return this.activitiesService.getAllActivities();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createActivity(
    @Body() body: CreateActivityDto,
  ): Promise<CreateActivityResponseDto> {
    return this.activitiesService.createActivity(body);
  }

  @Patch(':id/approve')
  approveActivity(
    @Param('id') id: string,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activitiesService.approveActivity(id);
  }

  @Patch(':id/reject')
  rejectActivity(
    @Param('id') id: string,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activitiesService.rejectActivity(id);
  }
}
