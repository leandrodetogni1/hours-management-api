import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { UserCourse } from '../../enums/UserCourse.js';
import { UserSituation } from '../../enums/UserSituation.js';

export const FILTERABLE_ROLES = [
  'owner',
  'admin',
  'reviewer',
  'member',
] as const;
export type FilterableRole = (typeof FILTERABLE_ROLES)[number];

export const SORTABLE_USER_FIELDS = [
  'fullName',
  'firstName',
  'lastName',
  'email',
  'matricula',
  'situation',
  'createdAt',
] as const;
export type SortableUserField = (typeof SORTABLE_USER_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export class GetUsersQueryDto {
  @ApiPropertyOptional({
    example: 'regular',
    enum: UserSituation,
    description: 'Filtrar usuários por situação acadêmica',
  })
  @IsOptional()
  @Transform(({ value }) => (value as string)?.toUpperCase())
  @IsEnum(UserSituation, {
    message: 'Situação inválida. Use: regular, formando ou formado',
  })
  situation?: UserSituation;

  @ApiPropertyOptional({
    example: 'admin',
    enum: FILTERABLE_ROLES,
    description: 'Filtrar usuários por role',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsString({ message: 'Role deve ser uma string' })
  @IsIn(FILTERABLE_ROLES as unknown as string[], {
    message: 'Role inválida. Use: owner, admin, reviewer ou member',
  })
  role?: FilterableRole;

  @ApiPropertyOptional({
    example: 'CIENCIA_DA_COMPUTACAO',
    enum: UserCourse,
    description: 'Filtrar usuários por curso',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(UserCourse, {
    message:
      'Curso inválido. Use: CIENCIA_DA_COMPUTACAO ou ENGENHARIA_DA_COMPUTACAO',
  })
  course?: UserCourse;

  @ApiPropertyOptional({
    example: 'joão',
    description:
      'Busca textual case-insensitive em nome, sobrenome, email e matrícula',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Busca deve ser uma string' })
  @MaxLength(100, { message: 'Busca deve ter no máximo 100 caracteres' })
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    minimum: 1,
    description: 'Página (começa em 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um inteiro' })
  @Min(1, { message: 'page deve ser >= 1' })
  page: number = 1;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
    description: 'Itens por página (1–100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize deve ser um inteiro' })
  @Min(1, { message: 'pageSize deve ser >= 1' })
  @Max(100, { message: 'pageSize deve ser <= 100' })
  pageSize: number = 20;

  @ApiPropertyOptional({
    example: 'fullName',
    enum: SORTABLE_USER_FIELDS,
    default: 'fullName',
    description:
      'Campo de ordenação. fullName ordena por firstName e usa lastName como desempate. situation usa a ordem de prioridade FORMANDO → REGULAR → FORMADO (asc) e a inversa em desc, com firstName/lastName como desempate.',
  })
  @IsOptional()
  @IsIn(SORTABLE_USER_FIELDS as unknown as string[], {
    message:
      'sortBy inválido. Use: fullName, firstName, lastName, email, matricula, situation ou createdAt',
  })
  sortBy: SortableUserField = 'fullName';

  @ApiPropertyOptional({
    example: 'asc',
    enum: SORT_ORDERS,
    default: 'asc',
    description: 'Direção de ordenação',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(SORT_ORDERS as unknown as string[], {
    message: 'sortOrder inválido. Use: asc ou desc',
  })
  sortOrder: SortOrder = 'asc';
}
