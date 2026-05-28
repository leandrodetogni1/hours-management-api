import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { CurriculumYear } from '@prisma/client';

export class CreateCurriculumDto {
  @ApiProperty({ enum: CurriculumYear, example: 'Y2026' })
  @Expose()
  @IsNotEmpty({ message: 'O ano do currículo é obrigatório' })
  @IsEnum(CurriculumYear, { message: 'Ano de currículo inválido' })
  year: CurriculumYear;

  @ApiPropertyOptional({
    example: 120,
    description: 'Mínimo de horas exigido por categoria',
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: 'O mínimo por categoria deve ser inteiro' })
  @Min(0, { message: 'O mínimo por categoria não pode ser negativo' })
  @Type(() => Number)
  minHoursPerCategory?: number | null;

  @ApiPropertyOptional({
    example: 2,
    description: 'Quantidade de categorias com mínimo atendido (2 ou 3)',
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: 'minCategoriesRequired deve ser inteiro' })
  @IsIn([2, 3], { message: 'minCategoriesRequired deve ser 2 ou 3' })
  @Type(() => Number)
  minCategoriesRequired?: number | null;

  @ApiProperty({
    example: 1,
    description: 'Multiplicador aplicado ao excesso de Complementar para Livre',
  })
  @Expose()
  @IsNotEmpty({ message: 'O multiplicador é obrigatório' })
  @IsNumber({}, { message: 'O multiplicador deve ser um número' })
  @Min(0, { message: 'O multiplicador não pode ser negativo' })
  @Type(() => Number)
  excessToFreeMultiplier: number;

  @ApiProperty({
    example: 217,
    description: 'Mínimo de horas em Formação Livre',
  })
  @Expose()
  @IsNotEmpty({ message: 'O mínimo de horas livres é obrigatório' })
  @IsInt({ message: 'O mínimo de horas livres deve ser inteiro' })
  @Min(0, { message: 'O mínimo de horas livres não pode ser negativo' })
  @Type(() => Number)
  minFreeHours: number;
}
