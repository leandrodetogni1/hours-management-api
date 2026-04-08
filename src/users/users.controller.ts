import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { UsersService } from './services/users.service.js';
import { CreateUserDto } from './dto/CreateUserDto.js';
import {
  CreateUserResponseDto,
  UserResponseDto,
} from './dto/UserResponseDto.js';
import { ActivityResponseDto } from '../activities/dto/ActivityResponseDto.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários',
    type: [UserResponseDto],
  })
  findAll(): Promise<UserResponseDto[]> {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.getUserById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado',
    type: CreateUserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  createUser(@Body() body: CreateUserDto): Promise<CreateUserResponseDto> {
    return this.usersService.createUser(body);
  }

  @Get(':userId/activities')
  @ApiOperation({ summary: 'Listar atividades de um usuário' })
  @ApiParam({ name: 'userId', description: 'UUID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de atividades do usuário',
    type: [ActivityResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  getUserActivities(
    @Param('userId') userId: string,
  ): Promise<ActivityResponseDto[]> {
    return this.usersService.getUserActivities(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar usuário por ID' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({ status: 204, description: 'Usuário deletado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersService.deleteUser(id);
  }
}
