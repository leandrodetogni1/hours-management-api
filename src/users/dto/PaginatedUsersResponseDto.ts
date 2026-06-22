import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './UserResponseDto.js';

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: UserResponseDto, isArray: true })
  items: UserResponseDto[];

  @ApiProperty({
    example: 42,
    description: 'Total de usuários (sem paginação)',
  })
  total: number;

  @ApiProperty({ example: 1, description: 'Página atual' })
  page: number;

  @ApiProperty({ example: 20, description: 'Itens por página' })
  pageSize: number;

  @ApiProperty({ example: 3, description: 'Total de páginas' })
  totalPages: number;
}
