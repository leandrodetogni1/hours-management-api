import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepositoriesModule } from '../repositories/users.module';
import { ActivitiesServiceModule } from '../../activities/services/activities.module';

@Module({
  imports: [UsersRepositoriesModule, ActivitiesServiceModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersServicesModule {}
