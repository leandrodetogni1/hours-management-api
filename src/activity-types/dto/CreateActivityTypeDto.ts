import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'A', description: 'Código do tipo de atividade', maxLength: 10 })
  @Expose()
  @IsNotEmpty({ message: 'O código é obrigatório' })
  @IsString({ message: 'O código deve ser uma string' })
  @MaxLength(10, { message: 'O código deve ter no máximo 10 caracteres' })
  cod: string;

  @ApiProperty({ example: 'Disciplinas cursadas em outras IES', description: 'Nome do tipo de atividade', maxLength: 255 })
  @Expose()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString({ message: 'O nome deve ser uma string' })
  @MaxLength(255, { message: 'O nome deve ter no máximo 255 caracteres' })
  label: string;

  @ApiProperty({ enum: Category, example: 'ENSINO', description: 'Categoria da atividade' })
  @Expose()
  @IsNotEmpty({ message: 'A categoria é obrigatória' })
  @IsEnum(Category, {
    message: 'Categoria inválida. Use: ENSINO, PESQUISA ou EXTENSAO',
  })
  category: Category;

  @ApiProperty({ enum: Unity, example: 'HORAS', description: 'Unidade de medida' })
  @Expose()
  @IsNotEmpty({ message: 'A unidade é obrigatória' })
  @IsEnum(Unity, {
    message: 'Unidade inválida. Use: SEMESTRE, HORAS ou UNIDADE',
  })
  unity: Unity;

  @ApiProperty({ example: 120, description: 'Máximo de horas em atividades complementares' })
  @Expose()
  @IsNotEmpty({ message: 'O máximo de horas complementares é obrigatório' })
  @IsNumber(
    {},
    { message: 'O máximo de horas complementares deve ser um número' },
  )
  @Type(() => Number)
  maxHoursInComplementarActivities: number;

  @ApiProperty({ example: 60, description: 'Máximo de horas por certificado ou semestre' })
  @Expose()
  @IsNotEmpty({ message: 'O máximo de horas por semestre é obrigatório' })
  @IsNumber(
    {},
    { message: 'O máximo de horas por semestre deve ser um número' },
  )
  @Type(() => Number)
  maxHoursPerCertificateOrSemester: number;
}
