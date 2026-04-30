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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtUserPayload } from '../auth/decorators/current-user.decorator.js';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator.js';

const ID_PARAM = { name: 'id', description: 'UUID da atividade' };
const REVIEWER_ROLES = ['admin', 'reviewer'];

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  @ApiEndpoint({
    summary: 'Listar atividades (filtro opcional por authorId)',
    description: 'Lista de atividades',
    type: ActivityResponseDto,
    isArray: true,
  })
  findAll(
    @Query() query: GetActivitiesQueryDto,
  ): Promise<ActivityResponseDto[]> {
    return this.activitiesService.getAllActivities(query.authorId);
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

  @Patch(':id/approve')
  @ApiEndpoint({
    summary:
      'Aprovar uma atividade (a partir de PENDING ou VERIFIED) — admin/reviewer',
    description: 'Atividade aprovada',
    type: UpdateActivityStatusResponseDto,
    params: [ID_PARAM],
    roles: REVIEWER_ROLES,
    errors: [
      {
        status: 400,
        description:
          'Transição de status inválida (só é permitido aprovar atividades PENDING ou VERIFIED)',
      },
    ],
  })
  approveActivity(
    @Param('id') id: string,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activitiesService.approveActivity(id);
  }

  @Patch(':id/reject')
  @ApiEndpoint({
    summary:
      'Rejeitar uma atividade (a partir de PENDING ou VERIFIED) — admin/reviewer',
    description: 'Atividade rejeitada',
    type: UpdateActivityStatusResponseDto,
    params: [ID_PARAM],
    roles: REVIEWER_ROLES,
    errors: [
      {
        status: 400,
        description:
          'Transição de status inválida (só é permitido rejeitar atividades PENDING ou VERIFIED)',
      },
    ],
  })
  rejectActivity(
    @Param('id') id: string,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activitiesService.rejectActivity(id);
  }

  @Patch(':id/verify')
  @ApiEndpoint({
    summary: 'Verificar uma atividade (a partir de PENDING) — admin/reviewer',
    description: 'Atividade verificada',
    type: UpdateActivityStatusResponseDto,
    params: [ID_PARAM],
    roles: REVIEWER_ROLES,
    errors: [
      {
        status: 400,
        description:
          'Transição de status inválida (só é permitido verificar atividades PENDING)',
      },
    ],
  })
  verifyActivity(
    @Param('id') id: string,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activitiesService.verifyActivity(id);
  }
}
