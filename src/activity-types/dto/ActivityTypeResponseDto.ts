import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivityTypeSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'A' })
  cod: string;

  @ApiProperty({ example: 'Disciplinas cursadas em outras IES' })
  label: string;
}

export class ActivityTypeNestedDto extends ActivityTypeSummaryDto {
  @ApiPropertyOptional({ example: 'ENSINO' })
  category: string | null;

  @ApiPropertyOptional({ example: 'HORAS' })
  unity: string | null;
}

export class ActivityTypeResponseDto extends ActivityTypeSummaryDto {
  @ApiPropertyOptional({ example: 120 })
  maxHoursInComplementarActivities: number | null;

  @ApiPropertyOptional({ example: 60 })
  maxHoursPerCertificateOrSemester: number | null;

  @ApiPropertyOptional({ example: 'ENSINO' })
  category: string | null;

  @ApiPropertyOptional({ example: 'HORAS' })
  unity: string | null;
}

export class CreateActivityTypeResponseDto {
  @ApiProperty({ example: 'Tipo de atividade criado com sucesso' })
  message: string;

  @ApiProperty({ type: ActivityTypeResponseDto })
  activityType: ActivityTypeResponseDto;
}

export class UpdateActivityTypeResponseDto {
  @ApiProperty({ example: 'Tipo de atividade atualizado com sucesso' })
  message: string;

  @ApiProperty({ type: ActivityTypeResponseDto })
  activityType: ActivityTypeResponseDto;
}

export class DeleteActivityTypeResponseDto {
  @ApiProperty({ example: 'Tipo de atividade removido com sucesso' })
  message: string;
}
