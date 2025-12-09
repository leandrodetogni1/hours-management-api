import { Expose, Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { ActivityClass } from 'src/enums/ActivityClass';

export class CreateActivityDto {
  @Expose()
  @IsNotEmpty()
  @IsEnum(ActivityClass)
  class: ActivityClass;

  @Expose()
  @IsNotEmpty()
  event: string;

  @Expose()
  @IsNotEmpty()
  organization: string;

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

  @Expose()
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  hours: number;

  @Expose()
  @IsNotEmpty()
  type: string;

  @Expose()
  @IsNotEmpty()
  files: File[];
}
