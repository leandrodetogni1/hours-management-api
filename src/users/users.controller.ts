import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { UsersService } from './services/users.service';
import { CreateUserDto } from './dto/CreateUserDto';
import { User } from './entities/User';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get()
  findAll(): { message: string; nome: string } {
    return {
      message: 'This action returns all users',
      nome: 'teste',
    };
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Post()
  createUser(@Body() body: CreateUserDto): User {
    return this.usersService.createUser(body);
  }
}
