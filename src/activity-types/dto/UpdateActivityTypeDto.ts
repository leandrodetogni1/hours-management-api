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
  @Expose()
  @IsOptional()
  @IsString({ message: 'O código deve ser uma string' })
  @MaxLength(10, { message: 'O código deve ter no máximo 10 caracteres' })
  cod?: string;

  @Expose()
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  @MaxLength(255, { message: 'O nome deve ter no máximo 255 caracteres' })
  label?: string;

  @Expose()
  @IsOptional()
  @IsEnum(Category, {
    message: 'Categoria inválida. Use: ENSINO, PESQUISA ou EXTENSAO',
  })
  category?: Category;

  @Expose()
  @IsOptional()
  @IsEnum(Unity, {
    message: 'Unidade inválida. Use: SEMESTRE, HORAS ou UNIDADE',
  })
  unity?: Unity;

  @Expose()
  @IsOptional()
  @IsNumber(
    {},
    { message: 'O máximo de horas complementares deve ser um número' },
  )
  @Type(() => Number)
  maxHoursInComplementarActivities?: number;

  @Expose()
  @IsOptional()
  @IsNumber(
    {},
    { message: 'O máximo de horas por semestre deve ser um número' },
  )
  @Type(() => Number)
  maxHoursPerCertificateOrSemester?: number;
}
