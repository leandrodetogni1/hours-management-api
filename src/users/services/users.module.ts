import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepositoriesModule } from '../repositories/users.module';

@Module({
  imports: [UsersRepositoriesModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersServicesModule {}
