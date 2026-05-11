import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxDate,
  MaxLength,
  Min,
  MinDate,
  MinLength,
} from 'class-validator';
import { ActivityClass } from '@prisma/client';

const MIN_DATE = new Date('2000-01-01');
const MAX_DATE = new Date('2100-01-01');

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateActivityDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'ID do tipo de atividade (UUID)',
  })
  @Expose()
  @IsOptional()
  @IsUUID('4', { message: 'activityTypeId deve ser um UUID válido' })
  activityTypeId?: string;

  @ApiPropertyOptional({
    enum: ActivityClass,
    example: 'COMPLEMENTAR',
    description: 'Classe da atividade',
  })
  @Expose()
  @IsOptional()
  @IsEnum(ActivityClass, {
    message: 'class deve ser um valor válido de ActivityClass',
  })
  class?: ActivityClass;

  @ApiPropertyOptional({
    example: 'Seminário de Computação',
    description: 'Nome do evento (1-255 caracteres)',
    maxLength: 255,
  })
  @Expose()
  @Transform(trim)
  @IsOptional()
  @IsString({ message: 'event deve ser uma string' })
  @IsNotEmpty({ message: 'event não pode ser vazio' })
  @MinLength(1, { message: 'event não pode ser vazio' })
  @MaxLength(255, { message: 'event deve ter no máximo 255 caracteres' })
  event?: string;

  @ApiPropertyOptional({
    example: 'UFPel',
    description: 'Organização responsável (até 255 caracteres)',
    maxLength: 255,
  })
  @Expose()
  @Transform(trim)
  @IsOptional()
  @IsString({ message: 'organization deve ser uma string' })
  @MaxLength(255, {
    message: 'organization deve ter no máximo 255 caracteres',
  })
  organization?: string;

  @ApiPropertyOptional({
    example: 40,
    description:
      'Quantidade informada pelo aluno. Semântica depende do tipo (ver POST). Para tipos de unidade SEMESTRE, omitir.',
    minimum: 0,
    maximum: 10000,
  })
  @Expose()
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'hours deve ser um número com no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'hours deve ser maior ou igual a 0' })
  @Max(10000, { message: 'hours deve ser menor ou igual a 10000' })
  hours?: number;

  @ApiPropertyOptional({
    example: 'https://drive.google.com/file/d/abc123/view',
    description: 'URL de validação do certificado (até 500 caracteres)',
    maxLength: 500,
  })
  @Expose()
  @Transform(trim)
  @IsOptional()
  @IsString({ message: 'certificateUrl deve ser uma string' })
  @MaxLength(500, {
    message: 'certificateUrl deve ter no máximo 500 caracteres',
  })
  certificateUrl?: string;

  @ApiPropertyOptional({
    example: '2025-03-01',
    description: 'Data de início (ISO 8601, entre 2000-01-01 e 2100-01-01)',
  })
  @Expose()
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'startDate deve ser uma data válida' })
  @MinDate(MIN_DATE, { message: 'startDate deve ser posterior a 2000-01-01' })
  @MaxDate(MAX_DATE, { message: 'startDate deve ser anterior a 2100-01-01' })
  startDate?: Date;

  @ApiPropertyOptional({
    example: '2025-03-15',
    description:
      'Data de término (ISO 8601). Após mescla com a atividade atual, deve ser >= startDate.',
  })
  @Expose()
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'endDate deve ser uma data válida' })
  @MinDate(MIN_DATE, { message: 'endDate deve ser posterior a 2000-01-01' })
  @MaxDate(MAX_DATE, { message: 'endDate deve ser anterior a 2100-01-01' })
  endDate?: Date;
}
