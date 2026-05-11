import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { CurriculumYear } from '../../enums/CurriculumYear.js';
import { UserCourse } from '../../enums/UserCourse.js';
import { UserSituation } from '../../enums/UserSituation.js';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'João',
    description: 'Primeiro nome do usuário',
  })
  @Expose()
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @Transform(({ value }) =>
    value
      ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      : value,
  )
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Silva',
    description: 'Sobrenome do usuário',
  })
  @Expose()
  @IsOptional()
  @IsString({ message: 'Sobrenome deve ser uma string' })
  @Transform(({ value }) =>
    value
      ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      : value,
  )
  lastName?: string;

  @ApiPropertyOptional({
    example: '12345678',
    description: 'Número de matrícula do usuário',
  })
  @Expose()
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== null ? String(value) : value,
  )
  @IsString({ message: 'Matrícula deve ser uma string' })
  @Matches(/^\d+$/, { message: 'Matrícula deve conter apenas números' })
  matricula?: string;

  @ApiPropertyOptional({
    example: 'REGULAR',
    enum: UserSituation,
    description: 'Situação acadêmica do usuário (padrão: REGULAR)',
    default: UserSituation.REGULAR,
  })
  @Expose()
  @IsOptional()
  @IsEnum(UserSituation, {
    message: 'Situação inválida. Use: REGULAR, FORMANDO ou FORMADO',
  })
  @Transform(({ value }) => value ?? UserSituation.REGULAR)
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

  @ApiPropertyOptional({
    example: 'Y2015',
    enum: CurriculumYear,
    description:
      'Ano do currículo do aluno (afeta limites de horas por tipo de atividade)',
  })
  @Expose()
  @IsOptional()
  @IsEnum(CurriculumYear, {
    message: 'Currículo inválido. Use: Y2012, Y2013 ou Y2015',
  })
  curriculumYear?: CurriculumYear;

  @ApiPropertyOptional({
    example: 'https://lh3.googleusercontent.com/a/ACg8oc...',
    description:
      'URL da foto de perfil (até 500 caracteres). Sobrescreve a foto importada do Google.',
    maxLength: 500,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: 'picture deve ser uma string' })
  @MaxLength(500, { message: 'picture deve ter no máximo 500 caracteres' })
  @IsUrl({}, { message: 'picture deve ser uma URL válida' })
  picture?: string;
}
