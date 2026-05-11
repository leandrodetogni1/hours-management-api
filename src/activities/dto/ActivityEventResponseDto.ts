import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivityEventActorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'João' })
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  lastName: string;

  @ApiProperty({ example: 'joao@ufpel.edu.br' })
  email: string;

  @ApiPropertyOptional({
    example: 'https://lh3.googleusercontent.com/a/ACg8oc...',
  })
  picture: string | null;
}

export class ActivityEventResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  activityId: string;

  @ApiPropertyOptional({
    example: 'PENDING',
    description: 'Status anterior (null no evento de criação)',
  })
  fromStatus: string | null;

  @ApiProperty({ example: 'VERIFIED' })
  toStatus: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description:
      'ID do usuário responsável pela transição (autor na criação; reviewer/admin nas demais)',
  })
  actorId: string;

  @ApiPropertyOptional({
    type: ActivityEventActorDto,
    description:
      'Dados resumidos do autor da transição (embed para evitar fetch extra no front)',
  })
  actor: ActivityEventActorDto | null;

  @ApiPropertyOptional({ example: 'Certificado ilegível' })
  comment: string | null;

  @ApiProperty({ example: '2025-04-03T14:00:00.000Z' })
  createdAt: string;
}
