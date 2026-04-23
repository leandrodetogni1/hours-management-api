import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class GetActivitiesQueryDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Filtrar atividades pelo ID do autor',
  })
  @IsOptional()
  @IsUUID('4', { message: 'authorId deve ser um UUID válido' })
  authorId?: string;
}
