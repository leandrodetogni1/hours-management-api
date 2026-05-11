import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurriculumYear } from '../../enums/CurriculumYear.js';
import { UserCourse } from '../../enums/UserCourse.js';
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

  @ApiPropertyOptional({
    example: 'https://lh3.googleusercontent.com/a/ACg8oc...',
    description: 'URL da foto de perfil (do Google ou definida pelo aluno)',
  })
  picture: string | null;

  @ApiProperty({
    example: 'MEMBER',
    enum: ['owner', 'admin', 'reviewer', 'member'],
  })
  role: string;

  @ApiPropertyOptional({ example: '12345678' })
  matricula: string | null;

  @ApiPropertyOptional({ example: 'REGULAR', enum: UserSituation })
  situation: UserSituation | null;

  @ApiPropertyOptional({
    example: 'CIENCIA_DA_COMPUTACAO',
    enum: UserCourse,
  })
  course: UserCourse | null;

  @ApiPropertyOptional({
    example: 'Y2015',
    enum: CurriculumYear,
  })
  curriculumYear: CurriculumYear | null;
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
