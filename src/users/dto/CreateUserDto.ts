import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { UserSituation } from '../../enums/UserSituation.js';

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

  @ApiProperty({
    example: '12345678',
    description: 'Número de matrícula do usuário',
  })
  @Expose()
  @IsString({ message: 'Matrícula deve ser uma string' })
  @IsNotEmpty({ message: 'Matrícula é obrigatória' })
  @Matches(/^\d+$/, { message: 'Matrícula deve conter apenas números' })
  matricula: string;

  @ApiPropertyOptional({
    example: 'REGULAR',
    enum: UserSituation,
    description: 'Situação acadêmica do usuário (padrão: REGULAR)',
  })
  @Expose()
  @IsOptional()
  @IsEnum(UserSituation, {
    message: 'Situação inválida. Use: REGULAR, FORMANDO ou FORMADO',
  })
  situation?: UserSituation;
}
