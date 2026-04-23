import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserSituation } from '../../enums/UserSituation.js';

export class UserSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'joao@ufpel.edu.br' })
  email: string;

  @ApiProperty({ example: 'João' })
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  lastName: string;

  @ApiProperty({
    example: 'MEMBER',
    enum: ['OWNER', 'ADMIN', 'REVIEWER', 'MEMBER'],
  })
  role: string;

  @ApiPropertyOptional({ example: '12345678' })
  matricula: string | null;

  @ApiPropertyOptional({ example: 'REGULAR', enum: UserSituation })
  situation: UserSituation | null;
}

export class UserResponseDto extends UserSummaryDto {
  @ApiPropertyOptional({ example: '2025-03-01T00:00:00.000Z' })
  createdAt: string | null;

  @ApiPropertyOptional({ example: '2025-03-01T00:00:00.000Z' })
  updatedAt: string | null;
}

export class CreateUserResponseDto {
  @ApiProperty({ example: 'Usuário criado com sucesso' })
  message: string;

  @ApiProperty({ type: UserSummaryDto })
  user: UserSummaryDto;
}
