import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ActivitiesService } from './services/activities.service';
import { CreateActivityDto } from './dto/CreateActivityDto';

@Controller('activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  findAll() {
    return this.activitiesService.getAllActivities();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createActivity(@Body() body: CreateActivityDto) {
    return this.activitiesService.createActivity(body);
  }
}
