import { ApiProperty } from '@nestjs/swagger';
import { ActivityResponseDto } from './ActivityResponseDto.js';

export class PaginatedActivitiesResponseDto {
  @ApiProperty({ type: ActivityResponseDto, isArray: true })
  items: ActivityResponseDto[];

  @ApiProperty({
    example: 42,
    description: 'Total de atividades (sem paginação)',
  })
  total: number;

  @ApiProperty({ example: 1, description: 'Página atual' })
  page: number;

  @ApiProperty({ example: 20, description: 'Itens por página' })
  pageSize: number;

  @ApiProperty({ example: 3, description: 'Total de páginas' })
  totalPages: number;
}
