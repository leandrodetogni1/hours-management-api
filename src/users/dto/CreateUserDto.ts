import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'joao@ufpel.edu.br',
    description: 'Email do usuário',
  })
  @Expose()
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: 'João', description: 'Primeiro nome do usuário' })
  @Expose()
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @Transform(
    ({ value }) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
  )
  firstName: string;

  @ApiProperty({ example: 'Silva', description: 'Sobrenome do usuário' })
  @Expose()
  @IsString({ message: 'Sobrenome deve ser uma string' })
  @IsNotEmpty({ message: 'Sobrenome é obrigatório' })
  @Transform(
    ({ value }) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
  )
  lastName: string;
}
