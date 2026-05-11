import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category, Course, CurriculumYear } from '@prisma/client';

export class FormandoUserSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'João' })
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  lastName: string;

  @ApiProperty({ example: 'joao@ufpel.edu.br' })
  email: string;

  @ApiPropertyOptional({
    example: 'https://lh3.googleusercontent.com/a/ACg8oc...',
  })
  picture: string | null;

  @ApiPropertyOptional({ example: '12345678' })
  matricula: string | null;

  @ApiPropertyOptional({ enum: Course, example: 'ENGENHARIA_DA_COMPUTACAO' })
  course: Course | null;

  @ApiPropertyOptional({ enum: CurriculumYear, example: 'Y2015' })
  curriculumYear: CurriculumYear | null;
}

export class CategoryGapDto {
  @ApiProperty({ enum: Category, example: 'ENSINO' })
  category: Category;

  @ApiProperty({ example: 80 })
  achieved: number;

  @ApiPropertyOptional({ example: 120 })
  required: number | null;

  @ApiProperty({
    example: 40,
    description: 'required - achieved, 0 se atingiu',
  })
  gap: number;
}

export class FormandoAtRiskDto {
  @ApiProperty({ type: FormandoUserSummaryDto })
  user: FormandoUserSummaryDto;

  @ApiProperty({ example: 250 })
  totalHoursApproved: number;

  @ApiProperty({
    example: 65,
    description:
      'Horas faltando para o mínimo total de Complementares. 0 se atingiu.',
  })
  complementaryGap: number;

  @ApiProperty({
    example: 120,
    description:
      'Horas faltando para o mínimo de Formação Livre. 0 se atingiu.',
  })
  freeGap: number;

  @ApiProperty({
    example: 225,
    description:
      'Soma das pendências por categoria + complementaryGap + freeGap. Usado para ordenação.',
  })
  totalGap: number;

  @ApiProperty({ type: [CategoryGapDto] })
  categoryGaps: CategoryGapDto[];

  @ApiProperty({
    type: [String],
    example: [
      'Faltam 40h em Ensino',
      'Faltam 30h em Pesquisa',
      'Faltam 65h no total de Complementares',
    ],
    description: 'Mensagens humanas para exibir na UI',
  })
  blockers: string[];

  @ApiProperty({
    example: false,
    description:
      'Todos os mínimos (categoria, total, formação livre) foram atingidos',
  })
  isReadyToGraduate: boolean;
}

export class CategoryHoursDto {
  @ApiProperty({ example: 30 })
  ENSINO: number;

  @ApiProperty({ example: 20 })
  PESQUISA: number;

  @ApiProperty({ example: 10 })
  EXTENSAO: number;
}

export class RegularStudentProgressDto {
  @ApiProperty({ type: FormandoUserSummaryDto })
  user: FormandoUserSummaryDto;

  @ApiProperty({ example: 80 })
  totalHoursApproved: number;

  @ApiProperty({
    example: 60,
    description: 'Horas APPROVED na classe COMPLEMENTAR',
  })
  complementaryHours: number;

  @ApiProperty({
    example: 20,
    description: 'Horas APPROVED na classe LIVRE',
  })
  freeHours: number;

  @ApiProperty({ type: CategoryHoursDto })
  categoryHours: CategoryHoursDto;
}

export class OldestPendingActivityAuthorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'João' })
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  lastName: string;
}

export class OldestPendingActivityDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiPropertyOptional({ example: 'Curso de Vue.js' })
  event: string | null;

  @ApiProperty({ example: '2025-04-03T14:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: 14, description: 'Dias desde createdAt até agora' })
  daysWaiting: number;

  @ApiProperty({ type: OldestPendingActivityAuthorDto })
  author: OldestPendingActivityAuthorDto;
}

export class ReviewQueueDto {
  @ApiProperty({ example: 12, description: 'PENDING + VERIFIED' })
  totalAwaiting: number;

  @ApiProperty({ example: 8 })
  pendingCount: number;

  @ApiProperty({ example: 4 })
  verifiedCount: number;

  @ApiPropertyOptional({
    type: OldestPendingActivityDto,
    description:
      'Atividade mais antiga aguardando revisão. Null se fila vazia.',
  })
  oldestAwaiting: OldestPendingActivityDto | null;
}

export class SystemStatsDto {
  @ApiProperty({ example: 87 })
  totalUsers: number;

  @ApiProperty({ example: 12 })
  totalFormandos: number;

  @ApiProperty({ example: 45 })
  activitiesApprovedLast30Days: number;

  @ApiProperty({ example: 8 })
  totalActivitiesPending: number;
}

export class AdminDashboardResponseDto {
  @ApiProperty({
    type: [FormandoAtRiskDto],
    description: 'Alunos FORMANDO ordenados por maior gap total descendente',
  })
  formandosAtRisk: FormandoAtRiskDto[];

  @ApiProperty({
    type: [RegularStudentProgressDto],
    description:
      'Alunos REGULAR ordenados por total de horas APPROVED descendente. Apenas progresso bruto — sem mensagens de "falta X horas" (essas são exclusivas para FORMANDO).',
  })
  regularStudentsProgress: RegularStudentProgressDto[];

  @ApiProperty({ type: ReviewQueueDto })
  reviewQueue: ReviewQueueDto;

  @ApiProperty({ type: SystemStatsDto })
  systemStats: SystemStatsDto;
}
