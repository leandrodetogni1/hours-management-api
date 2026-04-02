import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { Category, Unity } from '@prisma/client';

export class CreateActivityTypeDto {
  @Expose()
  @IsNotEmpty({ message: 'O código é obrigatório' })
  @IsString({ message: 'O código deve ser uma string' })
  @MaxLength(10, { message: 'O código deve ter no máximo 10 caracteres' })
  cod: string;

  @Expose()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString({ message: 'O nome deve ser uma string' })
  @MaxLength(255, { message: 'O nome deve ter no máximo 255 caracteres' })
  label: string;

  @Expose()
  @IsNotEmpty({ message: 'A categoria é obrigatória' })
  @IsEnum(Category, {
    message: 'Categoria inválida. Use: ENSINO, PESQUISA ou EXTENSAO',
  })
  category: Category;

  @Expose()
  @IsNotEmpty({ message: 'A unidade é obrigatória' })
  @IsEnum(Unity, {
    message: 'Unidade inválida. Use: SEMESTRE, HORAS ou UNIDADE',
  })
  unity: Unity;

  @Expose()
  @IsNotEmpty({ message: 'O máximo de horas complementares é obrigatório' })
  @IsNumber(
    {},
    { message: 'O máximo de horas complementares deve ser um número' },
  )
  @Type(() => Number)
  maxHoursInComplementarActivities: number;

  @Expose()
  @IsNotEmpty({ message: 'O máximo de horas por semestre é obrigatório' })
  @IsNumber(
    {},
    { message: 'O máximo de horas por semestre deve ser um número' },
  )
  @Type(() => Number)
  maxHoursPerCertificateOrSemester: number;
}
