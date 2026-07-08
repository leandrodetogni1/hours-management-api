import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateActivityNoteDto {
  @ApiPropertyOptional({
    example: 'Certificado está errado, verifique',
    description:
      'Nota do professor para o aluno (texto vazio ou nulo remove a nota)',
    maxLength: 1000,
    nullable: true,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: 'A nota deve ser uma string' })
  @MaxLength(1000, { message: 'A nota deve ter no máximo 1000 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string | null;
}
