import {
  Body,
  Controller,
  Delete,
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
import {
  ActivitiesService,
  DeletedActivityResult,
} from './services/activities.service.js';
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
import { ActivitiesListQueryDto } from './dto/ActivitiesListQueryDto.js';
import { PaginatedActivitiesResponseDto } from './dto/PaginatedActivitiesResponseDto.js';
import { TransitionActivityDto } from './dto/TransitionActivityDto.js';
import { UpdateActivityNoteDto } from './dto/UpdateActivityNoteDto.js';
import { ActivityEventResponseDto } from './dto/ActivityEventResponseDto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtUserPayload } from '../auth/decorators/current-user.decorator.js';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator.js';
import { Audit } from '../audit/audit.decorator.js';
import type { AuditRequestContext } from '../audit/audit.decorator.js';

const ID_PARAM = { name: 'id', description: 'UUID da atividade' };
const APPROVER_ROLES = ['owner', 'admin'];
const PRIVILEGED_ROLES = ['owner', 'admin', 'reviewer'];

const activityAuditMetadata = (
  _req: AuditRequestContext,
  result: unknown,
): Record<string, unknown> | null => {
  const activity = (result as { activity?: ActivityResponseDto } | undefined)
    ?.activity;
  if (!activity) return null;
  const metadata: Record<string, unknown> = {};
  if (typeof activity.event === 'string' && activity.event.length > 0) {
    metadata.label = activity.event;
  }
  if (typeof activity.authorId === 'string') {
    metadata.userId = activity.authorId;
  }
  return Object.keys(metadata).length > 0 ? metadata : null;
};

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  @ApiEndpoint({
    summary:
      'Listar atividades paginadas — owner/admin/reviewer apenas (filtros: authorId, categoria, status; ordenação por createdAt/status/hoursEquivalent)',
    description:
      'Lista paginada de atividades. Suporta filtros por authorId, categoria e status; ordenação por createdAt (padrão, desc), status ou hoursEquivalent.',
    type: PaginatedActivitiesResponseDto,
    roles: PRIVILEGED_ROLES,
  })
  findAll(
    @Query() query: GetActivitiesQueryDto,
  ): Promise<PaginatedActivitiesResponseDto> {
    return this.activitiesService.getAllActivities({
      authorId: query.authorId,
      status: query.status,
      category: query.category,
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get('me')
  @ApiEndpoint({
    summary:
      'Listar as atividades do usuário autenticado, paginadas (filtros por categoria/status; ordenação por createdAt/status/hoursEquivalent)',
    description:
      'Lista paginada das atividades do próprio usuário. Suporta filtros por categoria e status; ordenação por createdAt (padrão, desc), status ou hoursEquivalent.',
    type: PaginatedActivitiesResponseDto,
  })
  findMine(
    @CurrentUser() user: JwtUserPayload,
    @Query() query: ActivitiesListQueryDto,
  ): Promise<PaginatedActivitiesResponseDto> {
    return this.activitiesService.getMyActivities(user.sub, {
      status: query.status,
      category: query.category,
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get(':id')
  @ApiEndpoint({
    summary:
      'Buscar uma atividade por ID — dono da atividade ou owner/admin/reviewer',
    description: 'Atividade encontrada',
    type: ActivityResponseDto,
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
  getActivityById(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
  ): Promise<ActivityResponseDto> {
    return this.activitiesService.getActivityById(id, user);
  }

  @Post()
  @Audit({
    action: 'activity.created',
    entityType: 'activity',
    resolveMetadata: activityAuditMetadata,
  })
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
  @Audit({
    action: 'activity.updated',
    entityType: 'activity',
    resolveMetadata: activityAuditMetadata,
  })
  @ApiEndpoint({
    summary:
      'Editar uma atividade — dono da atividade ou reviewer apenas em PENDING; owner/admin em qualquer status, mantendo o status atual (apenas campos enviados são alterados; hoursEquivalent é recalculado). Aceita multipart/form-data para anexar/substituir o arquivo, ou removeFile=true para removê-lo',
    description: 'Atividade atualizada',
    type: UpdateActivityResponseDto,
    params: [ID_PARAM],
    hasBody: true,
    errors: [
      {
        status: 400,
        description:
          'Atividade não está em PENDING (dono/reviewer só podem editar PENDING; owner/admin editam qualquer status), endDate < startDate, ou envio de arquivo combinado com removeFile',
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
      { status: 413, description: 'Arquivo excede o tamanho máximo de 5MB' },
    ],
  })
  @ApiConsumes('multipart/form-data')
  @ApiExtraModels(UpdateActivityDto)
  @ApiBody({
    description:
      'Campos da atividade (form-data) e, opcionalmente, o arquivo do certificado (PDF, PNG ou JPEG, até 5MB). Envie removeFile=true para remover o arquivo atual.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdateActivityDto) },
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
  updateActivity(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateActivityDto,
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
  ): Promise<UpdateActivityResponseDto> {
    return this.activitiesService.updateActivity(id, body, user, file);
  }

  @Delete(':id')
  @Audit({ action: 'activity.deleted', entityType: 'activity' })
  @ApiEndpoint({
    summary:
      'Deletar uma atividade — member apenas as próprias e em PENDING; owner/admin qualquer atividade; reviewer não pode',
    status: HttpStatus.NO_CONTENT,
    description: 'Atividade deletada',
    params: [ID_PARAM],
    errors: [
      {
        status: 400,
        description:
          'Atividade não está em PENDING (member só pode deletar atividades PENDING)',
      },
      {
        status: 403,
        description:
          'Acesso negado (reviewer não pode deletar; member só pode deletar as próprias atividades)',
      },
      { status: 404, description: 'Atividade não encontrada' },
    ],
  })
  deleteActivity(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
  ): Promise<DeletedActivityResult> {
    return this.activitiesService.deleteActivity(id, user);
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
  @Audit({
    action: 'activity.approved',
    entityType: 'activity',
    resolveMetadata: activityAuditMetadata,
  })
  @ApiEndpoint({
    summary:
      'Aprovar uma atividade — owner/admin (a partir de qualquer status, exceto se já estiver APPROVED)',
    description: 'Atividade aprovada',
    type: UpdateActivityResponseDto,
    params: [ID_PARAM],
    roles: APPROVER_ROLES,
    hasBody: true,
    errors: [
      {
        status: 400,
        description:
          'Transição de status inválida (a atividade já está APPROVED)',
      },
    ],
  })
  approveActivity(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Body() body: TransitionActivityDto,
  ): Promise<UpdateActivityResponseDto> {
    return this.activitiesService.approveActivity(id, user, body.comment);
  }

  @Patch(':id/reject')
  @Audit({
    action: 'activity.rejected',
    entityType: 'activity',
    resolveMetadata: activityAuditMetadata,
  })
  @ApiEndpoint({
    summary:
      'Rejeitar uma atividade — reviewer a partir de PENDING/VERIFIED; owner/admin a partir de qualquer status (exceto se já estiver REJECTED)',
    description: 'Atividade rejeitada',
    type: UpdateActivityResponseDto,
    params: [ID_PARAM],
    roles: PRIVILEGED_ROLES,
    hasBody: true,
    errors: [
      {
        status: 400,
        description:
          'Transição de status inválida (reviewer: apenas a partir de PENDING ou VERIFIED; owner/admin: a atividade não pode já estar REJECTED)',
      },
    ],
  })
  rejectActivity(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Body() body: TransitionActivityDto,
  ): Promise<UpdateActivityResponseDto> {
    return this.activitiesService.rejectActivity(id, user, body.comment);
  }

  @Patch(':id/verify')
  @Audit({
    action: 'activity.verified',
    entityType: 'activity',
    resolveMetadata: activityAuditMetadata,
  })
  @ApiEndpoint({
    summary:
      'Verificar uma atividade — reviewer a partir de PENDING; owner/admin a partir de qualquer status (exceto se já estiver VERIFIED)',
    description: 'Atividade verificada',
    type: UpdateActivityResponseDto,
    params: [ID_PARAM],
    roles: PRIVILEGED_ROLES,
    hasBody: true,
    errors: [
      {
        status: 400,
        description:
          'Transição de status inválida (reviewer: apenas a partir de PENDING; owner/admin: a atividade não pode já estar VERIFIED)',
      },
    ],
  })
  verifyActivity(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Body() body: TransitionActivityDto,
  ): Promise<UpdateActivityResponseDto> {
    return this.activitiesService.verifyActivity(id, user, body.comment);
  }

  @Patch(':id/note')
  @Audit({
    action: 'activity.note_updated',
    entityType: 'activity',
    resolveMetadata: activityAuditMetadata,
  })
  @ApiEndpoint({
    summary:
      'Adicionar, editar ou remover a nota do professor — owner/admin/reviewer (texto vazio ou nulo remove)',
    description: 'Nota da atividade atualizada',
    type: UpdateActivityResponseDto,
    params: [ID_PARAM],
    roles: PRIVILEGED_ROLES,
    hasBody: true,
    errors: [
      {
        status: 400,
        description: 'Nota inválida (texto de até 1000 caracteres)',
      },
    ],
  })
  updateActivityNote(
    @Param('id') id: string,
    @Body() body: UpdateActivityNoteDto,
  ): Promise<UpdateActivityResponseDto> {
    return this.activitiesService.updateActivityNote(id, body.note);
  }
}
