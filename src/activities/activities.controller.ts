import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FilesInterceptor('files'))
  createActivity(
    @Body() body: CreateActivityDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log('Received files:', files);
    console.log(body);
    return this.activitiesService.createActivity(body, files);
  }
}
