import { ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class GetActivitiesQueryDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Filtrar atividades pelo ID do autor',
  })
  @IsOptional()
  @IsUUID('4', { message: 'authorId deve ser um UUID válido' })
  authorId?: string;

  @ApiPropertyOptional({
    enum: Status,
    example: Status.APPROVED,
    description: 'Filtrar pelas atividades com o status informado',
  })
  @IsOptional()
  @IsEnum(Status, {
    message: 'status deve ser PENDING, VERIFIED, APPROVED ou REJECTED',
  })
  status?: Status;
}
