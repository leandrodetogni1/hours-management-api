import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditActorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'joao@ufpel.edu.br' })
  email: string;

  @ApiProperty({ example: 'João' })
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  lastName: string;
}

export class AuditLogResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID do ator (null = sistema ou usuário removido)',
  })
  actorId: string | null;

  @ApiPropertyOptional({
    example: 'joao@ufpel.edu.br',
    description: 'E-mail do ator no momento da ação (snapshot)',
  })
  actorEmail: string | null;

  @ApiProperty({ example: 'activity.approved' })
  action: string;

  @ApiPropertyOptional({ example: 'activity' })
  entityType: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  entityId: string | null;

  @ApiPropertyOptional({ example: 'PATCH' })
  method: string | null;

  @ApiPropertyOptional({ example: '/api/activities/550e8400/approve' })
  path: string | null;

  @ApiPropertyOptional({ example: 200 })
  statusCode: number | null;

  @ApiPropertyOptional({ example: '192.168.0.1' })
  ip: string | null;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 ...' })
  userAgent: string | null;

  @ApiProperty({ example: '2025-03-01T12:34:56.000Z' })
  createdAt: string | null;

  @ApiPropertyOptional({
    type: AuditActorDto,
    nullable: true,
    description: 'Ator atual (se ainda existir no sistema)',
  })
  actor: AuditActorDto | null;
}

export class AuditLogsPageDto {
  @ApiProperty({ type: AuditLogResponseDto, isArray: true })
  items: AuditLogResponseDto[];

  @ApiProperty({
    example: 1234,
    description: 'Total de registros que casam com o filtro',
  })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 50 })
  limit: number;
}
