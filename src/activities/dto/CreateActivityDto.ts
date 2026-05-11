import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { IsEndDateAfterStartDate } from '../validators/end-date-after-start-date.validator.js';

const MIN_DATE = new Date('2000-01-01');
const MAX_DATE = new Date('2100-01-01');

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateActivityDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'ID do tipo de atividade (UUID)',
  })
  @Expose()
  @IsNotEmpty({ message: 'activityTypeId é obrigatório' })
  @IsUUID('4', { message: 'activityTypeId deve ser um UUID válido' })
  activityTypeId: string;

  @ApiProperty({
    enum: ActivityClass,
    example: 'COMPLEMENTAR',
    description: 'Classe da atividade',
  })
  @Expose()
  @IsNotEmpty({ message: 'class é obrigatório' })
  @IsEnum(ActivityClass, {
    message: 'class deve ser um valor válido de ActivityClass',
  })
  class: ActivityClass;

  @ApiProperty({
    example: 'Seminário de Computação',
    description: 'Nome do evento (1-255 caracteres)',
    maxLength: 255,
  })
  @Expose()
  @Transform(trim)
  @IsNotEmpty({ message: 'event é obrigatório' })
  @IsString({ message: 'event deve ser uma string' })
  @MinLength(1, { message: 'event não pode ser vazio' })
  @MaxLength(255, { message: 'event deve ter no máximo 255 caracteres' })
  event: string;

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

  @ApiProperty({
    example: 40,
    description: 'Quantidade de horas (0.5 a 10000)',
    minimum: 0.5,
    maximum: 10000,
  })
  @Expose()
  @IsNotEmpty({ message: 'hours é obrigatório' })
  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'hours deve ser um número com no máximo 2 casas decimais' },
  )
  @Min(0.5, { message: 'hours deve ser maior ou igual a 0.5' })
  @Max(10000, { message: 'hours deve ser menor ou igual a 10000' })
  hours: number;

  @ApiProperty({
    example: '2025-03-01',
    description: 'Data de início (ISO 8601, entre 2000-01-01 e 2100-01-01)',
  })
  @Expose()
  @IsNotEmpty({ message: 'startDate é obrigatório' })
  @Type(() => Date)
  @IsDate({ message: 'startDate deve ser uma data válida' })
  @MinDate(MIN_DATE, { message: 'startDate deve ser posterior a 2000-01-01' })
  @MaxDate(MAX_DATE, { message: 'startDate deve ser anterior a 2100-01-01' })
  startDate: Date;

  @ApiProperty({
    example: '2025-03-15',
    description: 'Data de término (ISO 8601, deve ser >= startDate)',
  })
  @Expose()
  @IsNotEmpty({ message: 'endDate é obrigatório' })
  @Type(() => Date)
  @IsDate({ message: 'endDate deve ser uma data válida' })
  @MinDate(MIN_DATE, { message: 'endDate deve ser posterior a 2000-01-01' })
  @MaxDate(MAX_DATE, { message: 'endDate deve ser anterior a 2100-01-01' })
  @IsEndDateAfterStartDate('startDate', {
    message: 'endDate deve ser maior ou igual a startDate',
  })
  endDate: Date;
}
