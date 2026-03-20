import { Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ActivityClass } from '@prisma/client';

export class CreateActivityDto {
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  authorId: string;

  @Expose()
  @IsNotEmpty()
  @IsUUID()
  activityTypeId: string;

  @Expose()
  @IsNotEmpty()
  @IsEnum(ActivityClass)
  class: ActivityClass;

  @Expose()
  @IsNotEmpty()
  @IsString()
  event: string;

  @Expose()
  @IsOptional()
  @IsString()
  organization?: string;

  @Expose()
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  hours: number;

  @Expose()
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @Expose()
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}
