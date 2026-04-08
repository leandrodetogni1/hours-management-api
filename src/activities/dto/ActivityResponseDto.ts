import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityTypeSummaryDto } from '../../activity-types/dto/ActivityTypeResponseDto.js';

export class ActivityUserSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'João' })
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  lastName: string;

  @ApiProperty({ example: 'joao@ufpel.edu.br' })
  email: string;
}

export class ActivityResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  authorId: string | null;

  @ApiPropertyOptional({ example: 'HORAS' })
  unity: string | null;

  @ApiPropertyOptional({ example: 'PENDING' })
  status: string | null;

  @ApiPropertyOptional({ example: 'ENSINO' })
  category: string | null;

  @ApiPropertyOptional({ example: 'COMPLEMENTAR' })
  class: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  activityTypeId: string | null;

  @ApiPropertyOptional({ example: 'Seminário de Computação' })
  event: string | null;

  @ApiPropertyOptional({ example: 'UFPel' })
  organization: string | null;

  @ApiPropertyOptional({ example: 40 })
  hours: number | null;

  @ApiPropertyOptional({ example: '2025-03-01' })
  startDate: string | null;

  @ApiPropertyOptional({ example: '2025-03-15' })
  endDate: string | null;

  @ApiPropertyOptional({ example: '2025-03-01T00:00:00.000Z' })
  createdAt: string | null;

  @ApiPropertyOptional({ example: '2025-03-01T00:00:00.000Z' })
  updatedAt: string | null;

  @ApiPropertyOptional({ type: ActivityUserSummaryDto, nullable: true })
  users: ActivityUserSummaryDto | null;

  @ApiPropertyOptional({ type: ActivityTypeSummaryDto, nullable: true })
  activity_types: ActivityTypeSummaryDto | null;
}

export class CreateActivityResponseDto {
  @ApiProperty({ example: 'Atividade criada com sucesso' })
  message: string;

  @ApiProperty({ type: ActivityResponseDto })
  activity: ActivityResponseDto;
}

export class UpdateActivityStatusResponseDto {
  @ApiProperty({ example: 'Atividade aprovada com sucesso' })
  message: string;

  @ApiProperty({ type: ActivityResponseDto })
  activity: ActivityResponseDto;
}
