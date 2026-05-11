import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UsersService } from './services/users.service.js';
import { CreateUserDto } from './dto/CreateUserDto.js';
import { UpdateUserDto } from './dto/UpdateUserDto.js';
import {
  CreateUserResponseDto,
  UserResponseDto,
} from './dto/UserResponseDto.js';
import { ActivityResponseDto } from '../activities/dto/ActivityResponseDto.js';
import { GetMyActivitiesQueryDto } from '../activities/dto/GetMyActivitiesQueryDto.js';
import { GetUsersQueryDto } from './dto/GetUsersQueryDto.js';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator.js';

const ID_PARAM = { name: 'id', description: 'UUID do usuário' };
const ADMIN_ROLES = ['admin'];

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiEndpoint({
    summary: 'Listar todos os usuários',
    description: 'Lista de usuários',
    type: UserResponseDto,
    isArray: true,
  })
  findAll(@Query() query: GetUsersQueryDto): Promise<UserResponseDto[]> {
    return this.usersService.getAllUsers(query.situation);
  }

  @Get(':id')
  @ApiEndpoint({
    summary: 'Buscar usuário por ID',
    description: 'Usuário encontrado',
    type: UserResponseDto,
    params: [ID_PARAM],
  })
  findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.getUserById(id);
  }

  @Post()
  @ApiEndpoint({
    summary: 'Criar um novo usuário (admin)',
    status: HttpStatus.CREATED,
    description: 'Usuário criado',
    type: CreateUserResponseDto,
    roles: ADMIN_ROLES,
    hasBody: true,
  })
  createUser(@Body() body: CreateUserDto): Promise<CreateUserResponseDto> {
    return this.usersService.createUser(body);
  }

  @Patch(':id')
  @ApiEndpoint({
    summary: 'Atualizar dados do usuário',
    description: 'Usuário atualizado',
    type: UserResponseDto,
    params: [ID_PARAM],
    hasBody: true,
  })
  updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(id, body);
  }

  @Get(':userId/activities')
  @ApiEndpoint({
    summary: 'Listar atividades de um usuário (filtro opcional por status)',
    description: 'Lista de atividades do usuário',
    type: ActivityResponseDto,
    isArray: true,
    params: [{ name: 'userId', description: 'UUID do usuário' }],
  })
  getUserActivities(
    @Param('userId') userId: string,
    @Query() query: GetMyActivitiesQueryDto,
  ): Promise<ActivityResponseDto[]> {
    return this.usersService.getUserActivities(userId, query.status);
  }

  @Delete(':id')
  @ApiEndpoint({
    summary: 'Deletar usuário por ID (admin)',
    status: HttpStatus.NO_CONTENT,
    description: 'Usuário deletado',
    params: [ID_PARAM],
    roles: ADMIN_ROLES,
  })
  deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersService.deleteUser(id);
  }
}
