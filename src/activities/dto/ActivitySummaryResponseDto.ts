import { ApiProperty } from '@nestjs/swagger';

export class ActivityStatusBreakdownDto {
  @ApiProperty({ example: 3 })
  count: number;

  @ApiProperty({ example: 45.5 })
  hours: number;
}

export class ActivitySummaryByStatusDto {
  @ApiProperty({ type: ActivityStatusBreakdownDto })
  PENDING: ActivityStatusBreakdownDto;

  @ApiProperty({ type: ActivityStatusBreakdownDto })
  VERIFIED: ActivityStatusBreakdownDto;

  @ApiProperty({ type: ActivityStatusBreakdownDto })
  APPROVED: ActivityStatusBreakdownDto;

  @ApiProperty({ type: ActivityStatusBreakdownDto })
  REJECTED: ActivityStatusBreakdownDto;
}

export class ApprovedHoursByCategoryDto {
  @ApiProperty({ example: 30 })
  ENSINO: number;

  @ApiProperty({ example: 20 })
  PESQUISA: number;

  @ApiProperty({ example: 10 })
  EXTENSAO: number;
}

export class ApprovedHoursByClassDto {
  @ApiProperty({ example: 50 })
  COMPLEMENTAR: number;

  @ApiProperty({ example: 10 })
  LIVRE: number;
}

export class ActivitySummaryResponseDto {
  @ApiProperty({ example: 11 })
  totalActivities: number;

  @ApiProperty({
    example: 60,
    description: 'Soma de horas das atividades APPROVED',
  })
  totalHoursApproved: number;

  @ApiProperty({
    example: 50,
    description: 'Soma de horas das atividades PENDING + VERIFIED',
  })
  totalHoursInReview: number;

  @ApiProperty({ type: ActivitySummaryByStatusDto })
  byStatus: ActivitySummaryByStatusDto;

  @ApiProperty({
    type: ApprovedHoursByCategoryDto,
    description: 'Horas APPROVED agrupadas por categoria do tipo de atividade',
  })
  approvedHoursByCategory: ApprovedHoursByCategoryDto;

  @ApiProperty({
    type: ApprovedHoursByClassDto,
    description: 'Horas APPROVED agrupadas pela classe da atividade',
  })
  approvedHoursByClass: ApprovedHoursByClassDto;
}
