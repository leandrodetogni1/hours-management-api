import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category, Course, CurriculumYear } from '@prisma/client';

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

export class CategoryProgressDto {
  @ApiProperty({ enum: Category, example: 'ENSINO' })
  category: Category;

  @ApiProperty({ example: 120 })
  hoursAchieved: number;

  @ApiPropertyOptional({
    example: 120,
    description: 'Mínimo exigido pelo currículo. Null se não definido.',
  })
  minRequired: number | null;

  @ApiProperty({
    example: true,
    description:
      'Se hoursAchieved atinge o mínimo (false se mínimo não definido).',
  })
  meetsMinimum: boolean;
}

export class ComplementaryProgressDto {
  @ApiProperty({
    example: 250,
    description: 'Total bruto de horas COMPLEMENTAR APPROVED.',
  })
  totalRawHours: number;

  @ApiProperty({
    example: 250,
    description:
      'Total aproveitado (truncado pelo teto total do curso/currículo, se houver).',
  })
  totalCountedHours: number;

  @ApiPropertyOptional({
    example: 315,
    description: 'Mínimo de horas necessárias para o curso/currículo.',
  })
  minRequired: number | null;

  @ApiPropertyOptional({
    example: 315,
    description: 'Máximo aceito (excesso vai para Formação Livre).',
  })
  maxAccepted: number | null;

  @ApiProperty({ example: false })
  meetsMinimum: boolean;
}

export class FreeProgressDto {
  @ApiProperty({
    example: 50,
    description: 'Horas lançadas diretamente como LIVRE (APPROVED).',
  })
  loggedHours: number;

  @ApiProperty({
    example: 0,
    description:
      'Excesso da Complementar que transborda para Livre (ajustado pelo multiplicador do currículo).',
  })
  carriedOverFromComplementary: number;

  @ApiProperty({ example: 50 })
  totalHours: number;

  @ApiProperty({ example: 217 })
  minRequired: number;

  @ApiProperty({ example: false })
  meetsMinimum: boolean;
}

export class CappedTypeWarningDto {
  @ApiProperty({ example: 'F' })
  cod: string;

  @ApiProperty({ example: 'Participação na Semana Acadêmica do Curso' })
  label: string;

  @ApiProperty({ example: 68 })
  hoursAchieved: number;

  @ApiProperty({ example: 68 })
  maxAllowed: number;
}

export class CurriculumContextDto {
  @ApiPropertyOptional({ enum: CurriculumYear, example: 'Y2015' })
  curriculumYear: CurriculumYear | null;

  @ApiPropertyOptional({ enum: Course, example: 'ENGENHARIA_DA_COMPUTACAO' })
  course: Course | null;
}

export class ActivitySummaryResponseDto {
  @ApiProperty({ example: 11 })
  totalActivities: number;

  @ApiProperty({
    example: 60,
    description: 'Soma de hoursEquivalent das atividades APPROVED',
  })
  totalHoursApproved: number;

  @ApiProperty({
    example: 50,
    description: 'Soma de hoursEquivalent das atividades PENDING + VERIFIED',
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

  @ApiProperty({ type: CurriculumContextDto })
  curriculum: CurriculumContextDto;

  @ApiProperty({
    type: [CategoryProgressDto],
    description:
      'Progresso por categoria vs mínimo do currículo. Vazio se o aluno não tem curriculumYear.',
  })
  categoryProgress: CategoryProgressDto[];

  @ApiProperty({ type: ComplementaryProgressDto })
  complementaryProgress: ComplementaryProgressDto;

  @ApiProperty({ type: FreeProgressDto })
  freeProgress: FreeProgressDto;

  @ApiProperty({
    type: [CappedTypeWarningDto],
    description: 'Tipos de atividade cujo teto total de horas foi atingido.',
  })
  cappedTypes: CappedTypeWarningDto[];
}
