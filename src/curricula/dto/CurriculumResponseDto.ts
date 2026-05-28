import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Course, CurriculumYear } from '@prisma/client';

export class CurriculumCourseRuleDto {
  @ApiProperty({ enum: Course, example: 'ENGENHARIA_DA_COMPUTACAO' })
  course: Course;

  @ApiProperty({
    example: 315,
    description: 'Mínimo total de horas complementares para o curso',
  })
  totalMin: number;

  @ApiProperty({
    example: 315,
    description:
      'Máximo aceito de horas complementares. Excesso vai para Formação Livre.',
  })
  totalMax: number;
}

export class CurriculumActivityTypeRuleDto {
  @ApiProperty({ example: 'A' })
  cod: string;

  @ApiProperty({ example: 'Monitorias' })
  label: string;

  @ApiProperty({
    example: 102,
    description: 'Máximo total de horas que o tipo aceita no currículo',
  })
  maxHoursTotal: number;

  @ApiProperty({
    example: 51,
    description: 'Máximo de horas por certificado ou semestre no currículo',
  })
  maxHoursPerCertificateOrSemester: number;
}

export class CurriculumSummaryDto {
  @ApiProperty({ enum: CurriculumYear, example: 'Y2015' })
  year: CurriculumYear;

  @ApiPropertyOptional({
    example: 120,
    description:
      'Mínimo de horas exigido por categoria (Ensino/Pesquisa/Extensão)',
  })
  minHoursPerCategory: number | null;

  @ApiPropertyOptional({
    example: 2,
    description: 'Quantidade de categorias com mínimo atendido (2 ou 3)',
  })
  minCategoriesRequired: number | null;

  @ApiProperty({
    example: 1,
    description:
      'Multiplicador aplicado ao excesso de horas complementares ao migrar para Formação Livre',
  })
  excessToFreeMultiplier: number;

  @ApiProperty({
    example: 217,
    description: 'Mínimo de horas em Formação Livre',
  })
  minFreeHours: number;
}

export class CurriculumResponseDto extends CurriculumSummaryDto {
  @ApiProperty({ type: [CurriculumCourseRuleDto] })
  courseRules: CurriculumCourseRuleDto[];

  @ApiProperty({ type: [CurriculumActivityTypeRuleDto] })
  activityTypeRules: CurriculumActivityTypeRuleDto[];
}

export class CreateCurriculumResponseDto {
  @ApiProperty({ example: 'Currículo criado com sucesso' })
  message: string;

  @ApiProperty({ type: CurriculumResponseDto })
  curriculum: CurriculumResponseDto;
}

export class UpdateCurriculumResponseDto {
  @ApiProperty({ example: 'Currículo atualizado com sucesso' })
  message: string;

  @ApiProperty({ type: CurriculumResponseDto })
  curriculum: CurriculumResponseDto;
}

export class DeleteCurriculumResponseDto {
  @ApiProperty({ example: 'Currículo removido com sucesso' })
  message: string;
}

export class UpsertCourseRuleResponseDto {
  @ApiProperty({ example: 'Regra de curso atualizada com sucesso' })
  message: string;

  @ApiProperty({ type: CurriculumCourseRuleDto })
  courseRule: CurriculumCourseRuleDto;
}

export class DeleteCourseRuleResponseDto {
  @ApiProperty({ example: 'Regra de curso removida com sucesso' })
  message: string;
}

export class UpsertActivityTypeRuleResponseDto {
  @ApiProperty({ example: 'Regra do tipo de atividade atualizada com sucesso' })
  message: string;

  @ApiProperty({ type: CurriculumActivityTypeRuleDto })
  activityTypeRule: CurriculumActivityTypeRuleDto;
}

export class DeleteActivityTypeRuleResponseDto {
  @ApiProperty({ example: 'Regra do tipo de atividade removida com sucesso' })
  message: string;
}
