import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/UserResponseDto.js';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT próprio do backend (válido por 7 dias por padrão)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
  })
  token: string;

  @ApiProperty({
    type: UserResponseDto,
    description: 'Usuário autenticado (criado no primeiro login)',
  })
  user: UserResponseDto;
}
