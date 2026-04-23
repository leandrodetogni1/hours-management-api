import {
  Body,
  Controller,
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
import { ActivitiesService } from './services/activities.service.js';
import { CreateActivityDto } from './dto/CreateActivityDto.js';
import {
  ActivityResponseDto,
  CreateActivityResponseDto,
  UpdateActivityStatusResponseDto,
} from './dto/ActivityResponseDto.js';
import { GetActivitiesQueryDto } from './dto/GetActivitiesQueryDto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtUserPayload } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar atividades (filtro opcional por authorId)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de atividades',
    type: [ActivityResponseDto],
  })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  findAll(
    @Query() query: GetActivitiesQueryDto,
  ): Promise<ActivityResponseDto[]> {
    return this.activitiesService.getAllActivities(query.authorId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Criar uma nova atividade (authorId é derivado do JWT, body não precisa enviar)',
  })
  @ApiResponse({
    status: 201,
    description: 'Atividade criada',
    type: CreateActivityResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  @ApiResponse({
    status: 404,
    description: 'Autor ou tipo de atividade não encontrado',
  })
  createActivity(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: CreateActivityDto,
  ): Promise<CreateActivityResponseDto> {
    return this.activitiesService.createActivity(user.sub, body);
  }

  @Roles('admin', 'reviewer')
  @Patch(':id/approve')
  @ApiOperation({
    summary:
      'Aprovar uma atividade (a partir de PENDING ou VERIFIED) — admin/reviewer',
  })
  @ApiParam({ name: 'id', description: 'UUID da atividade' })
  @ApiResponse({
    status: 200,
    description: 'Atividade aprovada',
    type: UpdateActivityStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Atividade não encontrada' })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Perfil sem permissão (admin ou reviewer)',
  })
  @ApiResponse({
    status: 400,
    description:
      'Transição de status inválida (só é permitido aprovar atividades PENDING ou VERIFIED)',
  })
  approveActivity(
    @Param('id') id: string,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activitiesService.approveActivity(id);
  }

  @Roles('admin', 'reviewer')
  @Patch(':id/reject')
  @ApiOperation({
    summary:
      'Rejeitar uma atividade (a partir de PENDING ou VERIFIED) — admin/reviewer',
  })
  @ApiParam({ name: 'id', description: 'UUID da atividade' })
  @ApiResponse({
    status: 200,
    description: 'Atividade rejeitada',
    type: UpdateActivityStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Atividade não encontrada' })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Perfil sem permissão (admin ou reviewer)',
  })
  @ApiResponse({
    status: 400,
    description:
      'Transição de status inválida (só é permitido rejeitar atividades PENDING ou VERIFIED)',
  })
  rejectActivity(
    @Param('id') id: string,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activitiesService.rejectActivity(id);
  }

  @Roles('admin', 'reviewer')
  @Patch(':id/verify')
  @ApiOperation({
    summary:
      'Verificar uma atividade (a partir de PENDING) — admin/reviewer',
  })
  @ApiParam({ name: 'id', description: 'UUID da atividade' })
  @ApiResponse({
    status: 200,
    description: 'Atividade verificada',
    type: UpdateActivityStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Atividade não encontrada' })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Perfil sem permissão (admin ou reviewer)',
  })
  @ApiResponse({
    status: 400,
    description:
      'Transição de status inválida (só é permitido verificar atividades PENDING)',
  })
  verifyActivity(
    @Param('id') id: string,
  ): Promise<UpdateActivityStatusResponseDto> {
    return this.activitiesService.verifyActivity(id);
  }
}
