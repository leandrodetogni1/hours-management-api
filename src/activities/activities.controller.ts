import { Body, Controller, Get, Post } from '@nestjs/common';
import { ActivitiesService } from './services/activities.service';
import { CreateActivityDto } from './dto/CreateActivityDto';

@Controller('activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}
  @Get()
  findAll(): { message: string } {
    return {
      message: 'This action returns all activities',
    };
  }

  @Post()
  createActivity(@Body() body: CreateActivityDto) {
    return this.activitiesService.createActivity(body);
  }
}
