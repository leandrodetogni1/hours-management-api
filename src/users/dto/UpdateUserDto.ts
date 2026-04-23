import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { UserCourse } from '../../enums/UserCourse.js';
import { UserSituation } from '../../enums/UserSituation.js';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'João', description: 'Primeiro nome do usuário' })
  @Expose()
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @Transform(
    ({ value }) => value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value,
  )
  firstName?: string;

  @ApiPropertyOptional({ example: 'Silva', description: 'Sobrenome do usuário' })
  @Expose()
  @IsOptional()
  @IsString({ message: 'Sobrenome deve ser uma string' })
  @Transform(
    ({ value }) => value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value,
  )
  lastName?: string;

  @ApiPropertyOptional({
    example: '12345678',
    description: 'Número de matrícula do usuário',
  })
  @Expose()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value) : value))
  @IsString({ message: 'Matrícula deve ser uma string' })
  @Matches(/^\d+$/, { message: 'Matrícula deve conter apenas números' })
  matricula?: string;

  @ApiPropertyOptional({
    example: 'REGULAR',
    enum: UserSituation,
    description: 'Situação acadêmica do usuário',
  })
  @Expose()
  @IsOptional()
  @IsEnum(UserSituation, {
    message: 'Situação inválida. Use: REGULAR, FORMANDO ou FORMADO',
  })
  situation?: UserSituation;

  @ApiPropertyOptional({
    example: 'CIENCIA_DA_COMPUTACAO',
    enum: UserCourse,
    description: 'Curso do usuário',
  })
  @Expose()
  @IsOptional()
  @IsEnum(UserCourse, {
    message:
      'Curso inválido. Use: CIENCIA_DA_COMPUTACAO ou ENGENHARIA_DA_COMPUTACAO',
  })
  course?: UserCourse;
}
