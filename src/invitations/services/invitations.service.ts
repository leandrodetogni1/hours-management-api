import { Injectable } from '@nestjs/common';
import { CreateInvitationDto } from '../dto/CreateInvitationDto';
import {
  CreateInvitationResponseDto,
  InvitationResponseDto,
} from '../dto/InvitationResponseDto';
import { InvitationsRepository } from '../repositories/invitations.repository';

@Injectable()
export class InvitationsService {
  constructor(private invitationsRepository: InvitationsRepository) {}

  getAllInvitations(): Promise<InvitationResponseDto[]> {
    return this.invitationsRepository.getAll();
  }

  createInvitation(
    dto: CreateInvitationDto,
    createdBy: string,
  ): Promise<CreateInvitationResponseDto> {
    return this.invitationsRepository.createInvitation(dto, createdBy);
  }

  deleteInvitation(id: string): Promise<void> {
    return this.invitationsRepository.deleteInvitation(id);
  }
}
