import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { ExportService } from './export.service';
import { UsersRepositoriesModule } from '../repositories/users.module';
import { ActivitiesServiceModule } from '../../activities/services/activities.module';
import { CurriculaRepositoryModule } from '../../curricula/repositories/curricula.module';

@Module({
  imports: [UsersRepositoriesModule, ActivitiesServiceModule, CurriculaRepositoryModule],
  providers: [UsersService, ExportService],
  exports: [UsersService, ExportService],
})
export class UsersServicesModule {}
