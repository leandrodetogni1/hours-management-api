import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ActivityClass } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID do autor (UUID)',
  })
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  authorId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'ID do tipo de atividade (UUID)',
  })
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  activityTypeId: string;

  @ApiProperty({
    enum: ActivityClass,
    example: 'COMPLEMENTAR',
    description: 'Classe da atividade',
  })
  @Expose()
  @IsNotEmpty()
  @IsEnum(ActivityClass)
  class: ActivityClass;

  @ApiProperty({
    example: 'Seminário de Computação',
    description: 'Nome do evento',
  })
  @Expose()
  @IsNotEmpty()
  @IsString()
  event: string;

  @ApiPropertyOptional({
    example: 'UFPel',
    description: 'Organização responsável',
  })
  @Expose()
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiProperty({ example: 40, description: 'Quantidade de horas' })
  @Expose()
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  hours: number;

  @ApiProperty({
    example: '2025-03-01',
    description: 'Data de início (ISO 8601)',
  })
  @Expose()
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    example: '2025-03-15',
    description: 'Data de término (ISO 8601)',
  })
  @Expose()
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}
