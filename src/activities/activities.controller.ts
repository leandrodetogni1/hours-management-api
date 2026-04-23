import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ActivitiesService } from './services/activities.service.js';
import { CreateActivityDto } from './dto/CreateActivityDto.js';
import {
  ActivityResponseDto,
  CreateActivityResponseDto,
  UpdateActivityStatusResponseDto,
} from './dto/ActivityResponseDto.js';

@ApiTags('Activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as atividades' })
  @ApiResponse({
    status: 200,
    description: 'Lista de atividades',
    type: [ActivityResponseDto],
  })
  findAll(): Promise<ActivityResponseDto[]> {
    return this.activitiesService.getAllActivities();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar uma nova atividade' })
  @ApiResponse({
    status: 201,
    description: 'Atividade criada',
    type: CreateActivityResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 404,
    description: 'Autor ou tipo de atividade não encontrado',
  })
  createActivity(
    @Body() body: CreateActivityDto,
  ): Promise<CreateActivityResponseDto> {
    return this.activitiesService.createActivity(body);
  }

  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Aprovar uma atividade (a partir de PENDING ou VERIFIED)',
  })
  @ApiParam({ name: 'id', description: 'UUID da atividade' })
  @ApiResponse({
    status: 200,
    description: 'Atividade aprovada',
    type: UpdateActivityStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Atividade não encontrada' })
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

  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Rejeitar uma atividade (a partir de PENDING ou VERIFIED)',
  })
  @ApiParam({ name: 'id', description: 'UUID da atividade' })
  @ApiResponse({
    status: 200,
    description: 'Atividade rejeitada',
    type: UpdateActivityStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Atividade não encontrada' })
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

  @Patch(':id/verify')
  @ApiOperation({
    summary: 'Verificar uma atividade (a partir de PENDING)',
  })
  @ApiParam({ name: 'id', description: 'UUID da atividade' })
  @ApiResponse({
    status: 200,
    description: 'Atividade verificada',
    type: UpdateActivityStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Atividade não encontrada' })
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
