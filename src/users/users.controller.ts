import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

import { UsersService } from './services/users.service.js';
import { CreateUserDto } from './dto/CreateUserDto.js';
import { UpdateUserDto } from './dto/UpdateUserDto.js';
import {
  CreateUserResponseDto,
  UserResponseDto,
} from './dto/UserResponseDto.js';
import { ActivityResponseDto } from '../activities/dto/ActivityResponseDto.js';
import { GetUsersQueryDto } from './dto/GetUsersQueryDto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Users')
@ApiBearerAuth()
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
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  findAll(@Query() query: GetUsersQueryDto): Promise<UserResponseDto[]> {
    return this.usersService.getAllUsers(query.situation);
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
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.getUserById(id);
  }

  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo usuário (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado',
    type: CreateUserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Perfil sem permissão (apenas admin)',
  })
  createUser(@Body() body: CreateUserDto): Promise<CreateUserResponseDto> {
    return this.usersService.createUser(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados do usuário' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(id, body);
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
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  getUserActivities(
    @Param('userId') userId: string,
  ): Promise<ActivityResponseDto[]> {
    return this.usersService.getUserActivities(userId);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar usuário por ID (admin)' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({ status: 204, description: 'Usuário deletado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Perfil sem permissão (apenas admin)',
  })
  deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersService.deleteUser(id);
  }
}
