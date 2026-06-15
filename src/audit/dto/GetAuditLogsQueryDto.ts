import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GetAuditLogsQueryDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Filtrar pelo ID do ator',
  })
  @IsOptional()
  @IsUUID('4', { message: 'actorId deve ser um UUID válido' })
  actorId?: string;

  @ApiPropertyOptional({
    example: 'activity.approved',
    description: 'Filtrar pela ação exata',
  })
  @IsOptional()
  @IsString({ message: 'action deve ser uma string' })
  @MaxLength(100, { message: 'action deve ter no máximo 100 caracteres' })
  action?: string;

  @ApiPropertyOptional({
    example: 'activity',
    description: 'Filtrar pelo tipo de entidade',
  })
  @IsOptional()
  @IsString({ message: 'entityType deve ser uma string' })
  @MaxLength(50, { message: 'entityType deve ter no máximo 50 caracteres' })
  entityType?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filtrar pelo ID da entidade afetada',
  })
  @IsOptional()
  @IsString({ message: 'entityId deve ser uma string' })
  @MaxLength(255, { message: 'entityId deve ter no máximo 255 caracteres' })
  entityId?: string;

  @ApiPropertyOptional({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Início do período (ISO 8601, inclusivo)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'from deve ser uma data válida' })
  from?: Date;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59.999Z',
    description: 'Fim do período (ISO 8601, inclusivo)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'to deve ser uma data válida' })
  to?: Date;

  @ApiPropertyOptional({
    example: 1,
    description: 'Página (começa em 1)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um inteiro' })
  @Min(1, { message: 'page deve ser maior ou igual a 1' })
  page: number = 1;

  @ApiPropertyOptional({
    example: 50,
    description: 'Itens por página (1 a 100)',
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit deve ser um inteiro' })
  @Min(1, { message: 'limit deve ser maior ou igual a 1' })
  @Max(100, { message: 'limit deve ser menor ou igual a 100' })
  limit: number = 50;
}
