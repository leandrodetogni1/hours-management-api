import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'ID token JWT emitido pelo Google (Google Identity Services)',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @Expose()
  @IsString({ message: 'idToken deve ser uma string' })
  @IsNotEmpty({ message: 'idToken é obrigatório' })
  idToken: string;
}
