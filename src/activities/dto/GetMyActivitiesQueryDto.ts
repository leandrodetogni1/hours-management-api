import { ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class GetMyActivitiesQueryDto {
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
