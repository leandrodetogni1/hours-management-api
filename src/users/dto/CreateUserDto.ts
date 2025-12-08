import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @Expose()
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @Expose()
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  firstName: string;

  @Expose()
  @IsString({ message: 'Sobrenome deve ser uma string' })
  @IsNotEmpty({ message: 'Sobrenome é obrigatório' })
  lastName: string;
}
