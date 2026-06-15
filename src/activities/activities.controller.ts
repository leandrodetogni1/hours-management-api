import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiProduces,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ActivitiesService } from './services/activities.service.js';
import { CreateActivityDto } from './dto/CreateActivityDto.js';
import {
  ALLOWED_ACTIVITY_FILE_MIME_TYPE_REGEX,
  MAX_ACTIVITY_FILE_SIZE,
} from './activity-file.constants.js';
import type { UploadedActivityFile } from './activity-file.constants.js';
import { UpdateActivityDto } from './dto/UpdateActivityDto.js';
import {
  ActivityResponseDto,
  CreateActivityResponseDto,
  UpdateActivityResponseDto,
} from './dto/ActivityResponseDto.js';
import { GetActivitiesQueryDto } from './dto/GetActivitiesQueryDto.js';
import { GetMyActivitiesQueryDto } from './dto/GetMyActivitiesQueryDto.js';
import { TransitionActivityDto } from './dto/TransitionActivityDto.js';
import { ActivityEventResponseDto } from './dto/ActivityEventResponseDto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtUserPayload } from '../auth/decorators/current-user.decorator.js';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator.js';

const ID_PARAM = { name: 'id', description: 'UUID da atividade' };
const REVIEWER_ROLES = ['admin', 'reviewer'];
const APPROVER_ROLES = ['owner', 'admin'];
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

  @Post()
  @ApiEndpoint({
    summary:
      'Criar uma nova atividade (authorId é derivado do JWT, body não precisa enviar). Aceita multipart/form-data com um arquivo opcional de certificado',
    status: HttpStatus.CREATED,
    description: 'Atividade criada',
    type: CreateActivityResponseDto,
    hasBody: true,
    errors: [
      { status: 404, description: 'Autor ou tipo de atividade não encontrado' },
      { status: 413, description: 'Arquivo excede o tamanho máximo de 5MB' },
    ],
  })
  @ApiConsumes('multipart/form-data')
  @ApiExtraModels(CreateActivityDto)
  @ApiBody({
    description:
      'Campos da atividade (form-data) e, opcionalmente, o arquivo do certificado (PDF, PNG ou JPEG, até 5MB)',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateActivityDto) },
        {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'Certificado em PDF, PNG ou JPEG (até 5MB)',
            },
          },
        },
      ],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_ACTIVITY_FILE_SIZE },
    }),
  )
  createActivity(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: CreateActivityDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_ACTIVITY_FILE_SIZE }),
          new FileTypeValidator({
            fileType: ALLOWED_ACTIVITY_FILE_MIME_TYPE_REGEX,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: UploadedActivityFile,
  ): Promise<CreateActivityResponseDto> {
    return this.activitiesService.createActivity(user.sub, body, file);
  }

  @Patch(':id')
  @ApiEndpoint({
    summary:
      'Editar uma atividade PENDING — dono da atividade ou owner/admin/reviewer (apenas campos enviados são alterados; hoursEquivalent é recalculado)',
    description: 'Atividade atualizada',
    type: UpdateActivityResponseDto,
    params: [ID_PARAM],
    hasBody: true,
    errors: [
      {
        status: 400,
        description:
          'Atividade não está em PENDING (apenas PENDING pode ser editada) ou endDate < startDate',
      },
      {
        status: 403,
        description:
          'Acesso negado (apenas o dono da atividade ou owner/admin/reviewer)',
      },
      {
        status: 404,
        description: 'Atividade ou tipo de atividade não encontrado',
      },
    ],
  })
  updateActivity(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateActivityDto,
  ): Promise<UpdateActivityResponseDto> {
    return this.activitiesService.updateActivity(id, body, user);
  }

  @Get(':id/events')
  @ApiEndpoint({
    summary:
      'Listar eventos (timeline) de uma atividade — dono da atividade ou owner/admin/reviewer',
    description: 'Lista de eventos',
    type: ActivityEventResponseDto,
    isArray: true,
    params: [ID_PARAM],
    errors: [
      {
        status: 403,
        description:
          'Acesso negado (apenas o dono da atividade ou owner/admin/reviewer)',
      },
      { status: 404, description: 'Atividade não encontrada' },
    ],
  })
  getActivityEvents(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
  ): Promise<ActivityEventResponseDto[]> {
    return this.activitiesService.getActivityEvents(id, user);
  }

  @Get(':id/file')
  @ApiEndpoint({
    summary:
      'Baixar/visualizar o arquivo (certificado) de uma atividade — dono da atividade ou owner/admin/reviewer',
    description: 'Arquivo binário do certificado (PDF, PNG ou JPEG)',
    params: [ID_PARAM],
    errors: [
      {
        status: 403,
        description:
          'Acesso negado (apenas o dono da atividade ou owner/admin/reviewer)',
      },
      {
        status: 404,
        description: 'Atividade não encontrada ou sem arquivo anexado',
      },
    ],
  })
  @ApiProduces('application/pdf', 'image/png', 'image/jpeg')
  async downloadActivityFile(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.activitiesService.getActivityFile(id, user);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.filename)}"`,
    );
    res.send(Buffer.from(file.data));
  }

  @Patch(':id/approve')
  @ApiEndpoint({
    summary:
      'Aprovar uma atividade (a partir de PENDING ou VERIFIED) — owner/admin apenas',
    description: 'Atividade aprovada',
    type: UpdateActivityResponseDto,
    params: [ID_PARAM],
    roles: APPROVER_ROLES,
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
  ): Promise<UpdateActivityResponseDto> {
    return this.activitiesService.approveActivity(id, user.sub, body.comment);
  }

  @Patch(':id/reject')
  @ApiEndpoint({
    summary:
      'Rejeitar uma atividade (a partir de PENDING ou VERIFIED) — admin/reviewer',
    description: 'Atividade rejeitada',
    type: UpdateActivityResponseDto,
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
  ): Promise<UpdateActivityResponseDto> {
    return this.activitiesService.rejectActivity(id, user.sub, body.comment);
  }

  @Patch(':id/verify')
  @ApiEndpoint({
    summary: 'Verificar uma atividade (a partir de PENDING) — admin/reviewer',
    description: 'Atividade verificada',
    type: UpdateActivityResponseDto,
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
  ): Promise<UpdateActivityResponseDto> {
    return this.activitiesService.verifyActivity(id, user.sub, body.comment);
  }
}
