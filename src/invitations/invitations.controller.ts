import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InvitationsService } from './services/invitations.service.js';
import { CreateInvitationDto } from './dto/CreateInvitationDto.js';
import {
  CreateInvitationResponseDto,
  InvitationResponseDto,
} from './dto/InvitationResponseDto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtUserPayload } from '../auth/decorators/current-user.decorator.js';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator.js';
import { Audit } from '../audit/audit.decorator.js';

const ID_PARAM = { name: 'id', description: 'UUID do convite' };
const OWNER_ROLES = ['owner'];

@ApiTags('Invitations')
@ApiBearerAuth()
@Controller('invitations')
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Get()
  @ApiEndpoint({
    summary: 'Listar convites pendentes — owner apenas',
    description: 'Lista de convites',
    type: InvitationResponseDto,
    isArray: true,
    roles: OWNER_ROLES,
  })
  findAll(): Promise<InvitationResponseDto[]> {
    return this.invitationsService.getAllInvitations();
  }

  @Post()
  @Audit({ action: 'invitation.created', entityType: 'invitation' })
  @ApiEndpoint({
    summary:
      'Criar convite (email + role) que será consumido no primeiro login Google do convidado — owner apenas',
    status: HttpStatus.CREATED,
    description: 'Convite criado',
    type: CreateInvitationResponseDto,
    roles: OWNER_ROLES,
    hasBody: true,
    errors: [
      {
        status: 409,
        description: 'Já existe um usuário ou um convite com esse email',
      },
    ],
  })
  createInvitation(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: CreateInvitationDto,
  ): Promise<CreateInvitationResponseDto> {
    return this.invitationsService.createInvitation(body, user.sub);
  }

  @Delete(':id')
  @Audit({ action: 'invitation.deleted', entityType: 'invitation' })
  @ApiEndpoint({
    summary: 'Revogar convite pendente — owner apenas',
    status: HttpStatus.NO_CONTENT,
    description: 'Convite revogado',
    params: [ID_PARAM],
    roles: OWNER_ROLES,
  })
  deleteInvitation(@Param('id') id: string): Promise<void> {
    return this.invitationsService.deleteInvitation(id);
  }
}
