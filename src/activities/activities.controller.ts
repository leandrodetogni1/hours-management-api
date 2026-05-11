import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActivitiesService } from './services/activities.service.js';
import { CreateActivityDto } from './dto/CreateActivityDto.js';
import {
  ActivityResponseDto,
  CreateActivityResponseDto,
  UpdateActivityStatusResponseDto,
} from './dto/ActivityResponseDto.js';
import { GetActivitiesQueryDto } from './dto/GetActivitiesQueryDto.js';
import { GetMyActivitiesQueryDto } from './dto/GetMyActivitiesQueryDto.js';
import { TransitionActivityDto } from './dto/TransitionActivityDto.js';
import { ActivityEventResponseDto } from './dto/ActivityEventResponseDto.js';
import { ActivitySummaryResponseDto } from './dto/ActivitySummaryResponseDto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtUserPayload } from '../auth/decorators/current-user.decorator.js';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator.js';

const ID_PARAM = { name: 'id', description: 'UUID da atividade' };
const REVIEWER_ROLES = ['admin', 'reviewer'];
const PRIVILEGED_ROLES = ['owner', 'admin', 'reviewer'];

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  @ApiEndpoint({
    summary:
      'Listar atividades — owner/admin/reviewer apenas (filtros opcionais: authorId, status)',
    description: 'Lista de atividades',
    type: ActivityResponseDto,
    isArray: true,
    roles: PRIVILEGED_ROLES,
  })
  findAll(
    @Query() query: GetActivitiesQueryDto,
  ): Promise<ActivityResponseDto[]> {
    return this.activitiesService.getAllActivities(
      query.authorId,
      query.status,
    );
  }

  @Get('me')
  @ApiEndpoint({
    summary:
      'Listar as atividades do usuário autenticado (filtro opcional por status)',
    description: 'Lista de atividades do próprio usuário',
    type: ActivityResponseDto,
    isArray: true,
  })
  findMine(
    @CurrentUser() user: JwtUserPayload,
    @Query() query: GetMyActivitiesQueryDto,
  ): Promise<ActivityResponseDto[]> {
    return this.activitiesService.getActivitiesByUserId(user.sub, query.status);
  }

  @Get('me/summary')
  @ApiEndpoint({
    summary:
      'Resumo das atividades do usuário autenticado para dashboard (contagens e horas por status, categoria e classe)',
    description: 'Resumo agregado das atividades do próprio usuário',
    type: ActivitySummaryResponseDto,
  })
  findMySummary(
    @CurrentUser() user: JwtUserPayload,
  ): Promise<ActivitySummaryResponseDto> {
    return this.activitiesService.getSummaryByUserId(user.sub);
  }

  @Post()
  @ApiEndpoint({
    summary:
      'Criar uma nova atividade (authorId é derivado do JWT, body não precisa enviar)',
    status: HttpStatus.CREATED,
    description: 'Atividade criada',
    type: CreateActivityResponseDto,
    hasBody: true,
    errors: [
      { status: 404, description: 'Autor ou tipo de atividade não encontrado' },
    ],
  })
  createActivity(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: CreateActivityDto,
  ): Promise<CreateActivityResponseDto> {
    return this.activitiesService.createActivity(user.sub, body);
  }

  @Get(':id/events')
  @ApiEndpoint({
    summary:
      'Listar eventos (timeline) de uma atividade — owner/admin/reviewer apenas',
    description: 'Lista de eventos',
    type: ActivityEventResponseDto,
    isArray: true,
    params: [ID_PARAM],
    roles: PRIVILEGED_ROLES,
    errors: [{ status: 404, description: 'Atividade não encontrada' }],
  })
  getActivityEvents(
    @Param('id') id: string,
  ): Promise<ActivityEventResponseDto[]> {
    return this.activitiesService.getActivityEvents(id);
  }

  @Patch(':id/approve')
  @ApiEndpoint({
    summary:
      'Aprovar uma atividade (a partir de PENDING ou VERIFIED) — admin/reviewer',
    description: 'Atividade aprovada',
    type: UpdateActivityStatusResponseDto,
    params: [ID_PARAM],
    roles: REVIEWER_ROLES,
    hasBody: true,
    errors: [
      {
        status: 400,
        description:
          'Transição de status inválida (só é permitido aprovar atividades PENDING ou VERIFIED)',
      },
    ],
  })
  approveActivity(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Body() body: TransitionActivityDto,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activitiesService.approveActivity(id, user.sub, body.comment);
  }

  @Patch(':id/reject')
  @ApiEndpoint({
    summary:
      'Rejeitar uma atividade (a partir de PENDING ou VERIFIED) — admin/reviewer',
    description: 'Atividade rejeitada',
    type: UpdateActivityStatusResponseDto,
    params: [ID_PARAM],
    roles: REVIEWER_ROLES,
    hasBody: true,
    errors: [
      {
        status: 400,
        description:
          'Transição de status inválida (só é permitido rejeitar atividades PENDING ou VERIFIED)',
      },
    ],
  })
  rejectActivity(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Body() body: TransitionActivityDto,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activitiesService.rejectActivity(id, user.sub, body.comment);
  }

  @Patch(':id/verify')
  @ApiEndpoint({
    summary: 'Verificar uma atividade (a partir de PENDING) — admin/reviewer',
    description: 'Atividade verificada',
    type: UpdateActivityStatusResponseDto,
    params: [ID_PARAM],
    roles: REVIEWER_ROLES,
    hasBody: true,
    errors: [
      {
        status: 400,
        description:
          'Transição de status inválida (só é permitido verificar atividades PENDING)',
      },
    ],
  })
  verifyActivity(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Body() body: TransitionActivityDto,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activitiesService.verifyActivity(id, user.sub, body.comment);
  }
}
