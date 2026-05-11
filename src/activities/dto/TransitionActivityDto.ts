import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TransitionActivityDto {
  @ApiPropertyOptional({
    example: 'Certificado ilegível',
    description:
      'Comentário/justificativa da transição (opcional em verify, approve e reject)',
    maxLength: 500,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: 'O comentário deve ser uma string' })
  @MaxLength(500, { message: 'O comentário deve ter no máximo 500 caracteres' })
  comment?: string;
}
