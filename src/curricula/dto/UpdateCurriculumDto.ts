import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateCurriculumDto {
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

  @ApiPropertyOptional({ example: 2 })
  @Expose()
  @IsOptional()
  @IsInt({ message: 'minCategoriesRequired deve ser inteiro' })
  @IsIn([2, 3], { message: 'minCategoriesRequired deve ser 2 ou 3' })
  @Type(() => Number)
  minCategoriesRequired?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @Expose()
  @IsOptional()
  @IsNumber({}, { message: 'O multiplicador deve ser um número' })
  @Min(0, { message: 'O multiplicador não pode ser negativo' })
  @Type(() => Number)
  excessToFreeMultiplier?: number;

  @ApiPropertyOptional({ example: 217 })
  @Expose()
  @IsOptional()
  @IsInt({ message: 'O mínimo de horas livres deve ser inteiro' })
  @Min(0, { message: 'O mínimo de horas livres não pode ser negativo' })
  @Type(() => Number)
  minFreeHours?: number;
}
