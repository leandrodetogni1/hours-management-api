import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvitationInviterDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'owner@ufpel.edu.br' })
  email: string;
}

export class InvitationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'professor@ufpel.edu.br' })
  email: string;

  @ApiProperty({ example: 'admin', enum: ['admin', 'reviewer'] })
  role: string;

  @ApiPropertyOptional({ type: InvitationInviterDto, nullable: true })
  inviter: InvitationInviterDto | null;

  @ApiProperty({ example: '2026-05-10T12:00:00.000Z' })
  createdAt: string;
}

export class CreateInvitationResponseDto {
  @ApiProperty({ example: 'Convite criado com sucesso' })
  message: string;

  @ApiProperty({ type: InvitationResponseDto })
  invitation: InvitationResponseDto;
}
