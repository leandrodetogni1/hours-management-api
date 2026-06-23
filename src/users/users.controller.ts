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
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { UsersService } from './services/users.service.js';
import { ExportService } from './services/export.service.js';
import { CreateUserDto } from './dto/CreateUserDto.js';
import { UpdateUserDto } from './dto/UpdateUserDto.js';
import {
  CreateUserResponseDto,
  UserResponseDto,
} from './dto/UserResponseDto.js';
import { ActivityResponseDto } from '../activities/dto/ActivityResponseDto.js';
import { ActivitySummaryResponseDto } from '../activities/dto/ActivitySummaryResponseDto.js';
import { GetMyActivitiesQueryDto } from '../activities/dto/GetMyActivitiesQueryDto.js';
import { GetUsersQueryDto } from './dto/GetUsersQueryDto.js';
import { PaginatedUsersResponseDto } from './dto/PaginatedUsersResponseDto.js';
import { FormandosAptosResponseDto } from './dto/FormandoAptoResponseDto.js';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator.js';
import { Audit } from '../audit/audit.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtUserPayload } from '../auth/decorators/current-user.decorator.js';

const ID_PARAM = { name: 'id', description: 'UUID do usuário' };
const ADMIN_ROLES = ['admin'];
const PRIVILEGED_ROLES = ['owner', 'admin', 'reviewer'];

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private exportService: ExportService,
  ) {}

  @Get()
  @ApiEndpoint({
    summary:
      'Listar usuários paginados — owner/admin/reviewer apenas (filtros por situação/role/curso, busca textual e ordenação)',
    description:
      'Lista paginada de usuários. Suporta filtros por situação, role e curso; busca textual case-insensitive em nome/sobrenome/email/matrícula; ordenação por firstName/lastName/email/matricula/createdAt e por situation (ordem de prioridade FORMANDO → REGULAR → FORMADO).',
    type: PaginatedUsersResponseDto,
    roles: PRIVILEGED_ROLES,
  })
  findAll(
    @Query() query: GetUsersQueryDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.usersService.getAllUsers({
      situation: query.situation,
      role: query.role,
      course: query.course,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get('formandos-aptos')
  @ApiEndpoint({
    summary: 'Listar formandos que completaram todas as horas — owner/admin/reviewer apenas',
    description: 'Retorna alunos com situation=FORMANDO e isReadyToGraduate=true, com horas por categoria',
    type: FormandosAptosResponseDto,
    roles: PRIVILEGED_ROLES,
  })
  getFormandosAptos(): Promise<FormandosAptosResponseDto> {
    return this.usersService.getFormandosAptos();
  }

  @Get('formandos-aptos/export')
  @ApiEndpoint({
    summary: 'Exportar formandos aptos em XLSX ou PDF — owner/admin/reviewer apenas',
    description: 'Download do arquivo. Use ?format=xlsx ou ?format=pdf',
    roles: PRIVILEGED_ROLES,
  })
  async exportFormandosAptos(
    @Query('format') format: 'xlsx' | 'pdf' = 'xlsx',
    @Res() res: Response,
  ): Promise<void> {
    const { items } = await this.usersService.getFormandosAptos();

    if (format === 'pdf') {
      const buffer = await this.exportService.generatePdf(items);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="formandos-aptos.pdf"',
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } else {
      const buffer = await this.exportService.generateXlsx(items);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="formandos-aptos.xlsx"',
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    }
  }

  @Get(':id')
  @ApiEndpoint({
    summary: 'Buscar usuário por ID — próprio usuário ou owner/admin/reviewer',
    description: 'Usuário encontrado',
    type: UserResponseDto,
    params: [ID_PARAM],
    selfOrRoles: { roles: PRIVILEGED_ROLES, param: 'id' },
  })
  findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.getUserById(id);
  }

  @Post()
  @Audit({ action: 'user.created', entityType: 'user' })
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
  @Audit({ action: 'user.updated', entityType: 'user' })
  @ApiEndpoint({
    summary:
      'Atualizar dados do usuário — próprio usuário (nome, curso, currículo, situação) ou owner/admin (qualquer campo, inclusive matrícula)',
    description: 'Usuário atualizado',
    type: UserResponseDto,
    params: [ID_PARAM],
    hasBody: true,
    selfOrRoles: { roles: ['owner', 'admin'], param: 'id' },
  })
  updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(id, body, currentUser);
  }

  @Get(':userId/activities')
  @ApiEndpoint({
    summary:
      'Listar atividades de um usuário — owner/admin/reviewer apenas (filtro opcional por status)',
    description: 'Lista de atividades do usuário',
    type: ActivityResponseDto,
    isArray: true,
    params: [{ name: 'userId', description: 'UUID do usuário' }],
    roles: PRIVILEGED_ROLES,
  })
  getUserActivities(
    @Param('userId') userId: string,
    @Query() query: GetMyActivitiesQueryDto,
  ): Promise<ActivityResponseDto[]> {
    return this.usersService.getUserActivities(userId, query.status);
  }

  @Get(':userId/activities/summary')
  @ApiEndpoint({
    summary:
      'Resumo das atividades de um usuário (contagens e horas por status, categoria e classe) — próprio usuário ou owner/admin/reviewer',
    description: 'Resumo agregado das atividades do usuário',
    type: ActivitySummaryResponseDto,
    params: [{ name: 'userId', description: 'UUID do usuário' }],
    selfOrRoles: { roles: PRIVILEGED_ROLES, param: 'userId' },
  })
  getUserActivitiesSummary(
    @Param('userId') userId: string,
  ): Promise<ActivitySummaryResponseDto> {
    return this.usersService.getUserActivitiesSummary(userId);
  }

  @Delete(':id')
  @Audit({ action: 'user.deleted', entityType: 'user' })
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
