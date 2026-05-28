import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpsertActivityTypeRuleDto {
  @ApiProperty({
    example: 102,
    description: 'Máximo total de horas do tipo de atividade no currículo',
  })
  @Expose()
  @IsNotEmpty({ message: 'maxHoursTotal é obrigatório' })
  @IsInt({ message: 'maxHoursTotal deve ser inteiro' })
  @Min(0, { message: 'maxHoursTotal não pode ser negativo' })
  @Type(() => Number)
  maxHoursTotal: number;

  @ApiProperty({
    example: 51,
    description: 'Máximo de horas por certificado ou semestre no currículo',
  })
  @Expose()
  @IsNotEmpty({ message: 'maxHoursPerCertificateOrSemester é obrigatório' })
  @IsInt({ message: 'maxHoursPerCertificateOrSemester deve ser inteiro' })
  @Min(0, { message: 'maxHoursPerCertificateOrSemester não pode ser negativo' })
  @Type(() => Number)
  maxHoursPerCertificateOrSemester: number;
}
