import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { UserSituation } from '../../enums/UserSituation.js';

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
}
