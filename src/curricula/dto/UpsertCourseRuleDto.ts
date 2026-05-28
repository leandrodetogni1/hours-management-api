import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpsertCourseRuleDto {
  @ApiProperty({
    example: 315,
    description: 'Mínimo total de horas complementares para o curso',
  })
  @Expose()
  @IsNotEmpty({ message: 'totalMin é obrigatório' })
  @IsInt({ message: 'totalMin deve ser inteiro' })
  @Min(0, { message: 'totalMin não pode ser negativo' })
  @Type(() => Number)
  totalMin: number;

  @ApiProperty({
    example: 315,
    description:
      'Máximo aceito de horas complementares (excesso vai para Formação Livre)',
  })
  @Expose()
  @IsNotEmpty({ message: 'totalMax é obrigatório' })
  @IsInt({ message: 'totalMax deve ser inteiro' })
  @Min(0, { message: 'totalMax não pode ser negativo' })
  @Type(() => Number)
  totalMax: number;
}
