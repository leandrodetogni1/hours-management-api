import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActivityTypesService } from './services/activity-types.service.js';
import {
  ActivityTypeResponseDto,
  CreateActivityTypeResponseDto,
  UpdateActivityTypeResponseDto,
} from './dto/ActivityTypeResponseDto.js';
import { CreateActivityTypeDto } from './dto/CreateActivityTypeDto.js';
import { UpdateActivityTypeDto } from './dto/UpdateActivityTypeDto.js';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator.js';
import { Audit } from '../audit/audit.decorator.js';

const ID_PARAM = { name: 'id', description: 'UUID do tipo de atividade' };
const ADMIN_ROLES = ['admin'];

@ApiTags('Activity Types')
@ApiBearerAuth()
@Controller('activity-types')
export class ActivityTypesController {
  constructor(private activityTypesService: ActivityTypesService) {}

  @Get()
  @ApiEndpoint({
    summary: 'Listar todos os tipos de atividade',
    description: 'Lista de tipos de atividade',
    type: ActivityTypeResponseDto,
    isArray: true,
  })
  findAll(): Promise<ActivityTypeResponseDto[]> {
    return this.activityTypesService.getAllActivityTypes();
  }

  @Get(':id')
  @ApiEndpoint({
    summary: 'Buscar tipo de atividade por ID',
    description: 'Tipo de atividade encontrado',
    type: ActivityTypeResponseDto,
    params: [ID_PARAM],
  })
  findById(@Param('id') id: string): Promise<ActivityTypeResponseDto> {
    return this.activityTypesService.getActivityTypeById(id);
  }

  @Post()
  @Audit({ action: 'activity_type.created', entityType: 'activity_type' })
  @ApiEndpoint({
    summary: 'Criar um novo tipo de atividade (admin)',
    status: HttpStatus.CREATED,
    description: 'Tipo de atividade criado',
    type: CreateActivityTypeResponseDto,
    roles: ADMIN_ROLES,
    hasBody: true,
  })
  create(
    @Body() body: CreateActivityTypeDto,
  ): Promise<CreateActivityTypeResponseDto> {
    return this.activityTypesService.createActivityType(body);
  }

  @Patch(':id')
  @Audit({ action: 'activity_type.updated', entityType: 'activity_type' })
  @ApiEndpoint({
    summary: 'Atualizar tipo de atividade (admin)',
    description: 'Tipo de atividade atualizado',
    type: UpdateActivityTypeResponseDto,
    params: [ID_PARAM],
    roles: ADMIN_ROLES,
    hasBody: true,
  })
  update(
    @Param('id') id: string,
    @Body() body: UpdateActivityTypeDto,
  ): Promise<UpdateActivityTypeResponseDto> {
    return this.activityTypesService.updateActivityType(id, body);
  }

  @Delete(':id')
  @Audit({ action: 'activity_type.deleted', entityType: 'activity_type' })
  @ApiEndpoint({
    summary: 'Deletar tipo de atividade (admin)',
    status: HttpStatus.NO_CONTENT,
    description: 'Tipo de atividade deletado',
    params: [ID_PARAM],
    roles: ADMIN_ROLES,
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.activityTypesService.deleteActivityType(id);
  }
}
