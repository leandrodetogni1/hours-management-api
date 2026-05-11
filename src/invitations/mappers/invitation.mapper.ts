import { invitations, roles, users } from '@prisma/client';
import { InvitationResponseDto } from '../dto/InvitationResponseDto';

type InvitationWithRelations = invitations & {
  role: roles;
  inviter: Pick<users, 'id' | 'email'> | null;
};

export class InvitationMapper {
  static toResponseDto(
    invitation: InvitationWithRelations,
  ): InvitationResponseDto {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role.name,
      inviter: invitation.inviter
        ? { id: invitation.inviter.id, email: invitation.inviter.email }
        : null,
      createdAt: invitation.createdAt.toISOString(),
    };
  }
}
