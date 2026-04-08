import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Category, Unity } from '@prisma/client';

export class UpdateActivityTypeDto {
  @ApiPropertyOptional({ example: 'A', description: 'Código do tipo de atividade', maxLength: 10 })
  @Expose()
  @IsOptional()
  @IsString({ message: 'O código deve ser uma string' })
  @MaxLength(10, { message: 'O código deve ter no máximo 10 caracteres' })
  cod?: string;

  @ApiPropertyOptional({ example: 'Disciplinas cursadas em outras IES', description: 'Nome do tipo de atividade', maxLength: 255 })
  @Expose()
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  @MaxLength(255, { message: 'O nome deve ter no máximo 255 caracteres' })
  label?: string;

  @ApiPropertyOptional({ enum: Category, example: 'ENSINO', description: 'Categoria da atividade' })
  @Expose()
  @IsOptional()
  @IsEnum(Category, {
    message: 'Categoria inválida. Use: ENSINO, PESQUISA ou EXTENSAO',
  })
  category?: Category;

  @ApiPropertyOptional({ enum: Unity, example: 'HORAS', description: 'Unidade de medida' })
  @Expose()
  @IsOptional()
  @IsEnum(Unity, {
    message: 'Unidade inválida. Use: SEMESTRE, HORAS ou UNIDADE',
  })
  unity?: Unity;

  @ApiPropertyOptional({ example: 120, description: 'Máximo de horas em atividades complementares' })
  @Expose()
  @IsOptional()
  @IsNumber(
    {},
    { message: 'O máximo de horas complementares deve ser um número' },
  )
  @Type(() => Number)
  maxHoursInComplementarActivities?: number;

  @ApiPropertyOptional({ example: 60, description: 'Máximo de horas por certificado ou semestre' })
  @Expose()
  @IsOptional()
  @IsNumber(
    {},
    { message: 'O máximo de horas por semestre deve ser um número' },
  )
  @Type(() => Number)
  maxHoursPerCertificateOrSemester?: number;
}
