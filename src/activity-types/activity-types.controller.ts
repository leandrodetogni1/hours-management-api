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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ActivityTypesService } from './services/activity-types.service.js';
import {
  ActivityTypeResponseDto,
  CreateActivityTypeResponseDto,
  UpdateActivityTypeResponseDto,
} from './dto/ActivityTypeResponseDto.js';
import { CreateActivityTypeDto } from './dto/CreateActivityTypeDto.js';
import { UpdateActivityTypeDto } from './dto/UpdateActivityTypeDto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Activity Types')
@ApiBearerAuth()
@Controller('activity-types')
export class ActivityTypesController {
  constructor(private activityTypesService: ActivityTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os tipos de atividade' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tipos de atividade',
    type: [ActivityTypeResponseDto],
  })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  findAll(): Promise<ActivityTypeResponseDto[]> {
    return this.activityTypesService.getAllActivityTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tipo de atividade por ID' })
  @ApiParam({ name: 'id', description: 'UUID do tipo de atividade' })
  @ApiResponse({
    status: 200,
    description: 'Tipo de atividade encontrado',
    type: ActivityTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tipo de atividade não encontrado' })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  findById(@Param('id') id: string): Promise<ActivityTypeResponseDto> {
    return this.activityTypesService.getActivityTypeById(id);
  }

  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo tipo de atividade (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Tipo de atividade criado',
    type: CreateActivityTypeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Perfil sem permissão (apenas admin)',
  })
  create(
    @Body() body: CreateActivityTypeDto,
  ): Promise<CreateActivityTypeResponseDto> {
    return this.activityTypesService.createActivityType(body);
  }

  @Roles('admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar tipo de atividade (admin)' })
  @ApiParam({ name: 'id', description: 'UUID do tipo de atividade' })
  @ApiResponse({
    status: 200,
    description: 'Tipo de atividade atualizado',
    type: UpdateActivityTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tipo de atividade não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Perfil sem permissão (apenas admin)',
  })
  update(
    @Param('id') id: string,
    @Body() body: UpdateActivityTypeDto,
  ): Promise<UpdateActivityTypeResponseDto> {
    return this.activityTypesService.updateActivityType(id, body);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar tipo de atividade (admin)' })
  @ApiParam({ name: 'id', description: 'UUID do tipo de atividade' })
  @ApiResponse({ status: 204, description: 'Tipo de atividade deletado' })
  @ApiResponse({ status: 404, description: 'Tipo de atividade não encontrado' })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Perfil sem permissão (apenas admin)',
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.activityTypesService.deleteActivityType(id);
  }
}
