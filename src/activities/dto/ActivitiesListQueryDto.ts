import { ApiPropertyOptional } from '@nestjs/swagger';
import { Category, Status } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const SORTABLE_ACTIVITY_FIELDS = [
  'createdAt',
  'status',
  'hoursEquivalent',
] as const;
export type SortableActivityField = (typeof SORTABLE_ACTIVITY_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export class ActivitiesListQueryDto {
  @ApiPropertyOptional({
    enum: Category,
    example: Category.ENSINO,
    description: 'Filtrar pela categoria do tipo de atividade',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(Category, {
    message: 'category deve ser ENSINO, PESQUISA ou EXTENSAO',
  })
  category?: Category;

  @ApiPropertyOptional({
    enum: Status,
    example: Status.APPROVED,
    description: 'Filtrar pelas atividades com o status informado',
  })
  @IsOptional()
  @IsEnum(Status, {
    message: 'status deve ser PENDING, VERIFIED, APPROVED ou REJECTED',
  })
  status?: Status;

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
    enum: SORTABLE_ACTIVITY_FIELDS,
    default: 'createdAt',
    example: 'createdAt',
    description:
      'Campo de ordenação. status ordena pela ordem do enum (PENDING, VERIFIED, APPROVED, REJECTED).',
  })
  @IsOptional()
  @IsIn(SORTABLE_ACTIVITY_FIELDS as unknown as string[], {
    message: 'sortBy inválido. Use: createdAt, status ou hoursEquivalent',
  })
  sortBy: SortableActivityField = 'createdAt';

  @ApiPropertyOptional({
    enum: SORT_ORDERS,
    default: 'desc',
    example: 'desc',
    description: 'Direção de ordenação',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(SORT_ORDERS as unknown as string[], {
    message: 'sortOrder inválido. Use: asc ou desc',
  })
  sortOrder: SortOrder = 'desc';
}
