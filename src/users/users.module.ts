import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersServicesModule } from './services/users.module';
@Module({
  imports: [UsersServicesModule],
  controllers: [UsersController],
})
export class UsersModule {}
