import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { UserSituation } from '../../enums/UserSituation.js';

export const FILTERABLE_ROLES = [
  'owner',
  'admin',
  'reviewer',
  'member',
] as const;
export type FilterableRole = (typeof FILTERABLE_ROLES)[number];

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
}
