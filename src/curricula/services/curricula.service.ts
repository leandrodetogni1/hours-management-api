import { Injectable, NotFoundException } from '@nestjs/common';
import { Course, CurriculumYear } from '@prisma/client';
import { CurriculaRepository } from '../repositories/curricula.repository';
import {
  CreateCurriculumResponseDto,
  CurriculumResponseDto,
  CurriculumSummaryDto,
  DeleteActivityTypeRuleResponseDto,
  DeleteCourseRuleResponseDto,
  DeleteCurriculumResponseDto,
  UpdateCurriculumResponseDto,
  UpsertActivityTypeRuleResponseDto,
  UpsertCourseRuleResponseDto,
} from '../dto/CurriculumResponseDto';
import { CreateCurriculumDto } from '../dto/CreateCurriculumDto';
import { UpdateCurriculumDto } from '../dto/UpdateCurriculumDto';
import { UpsertCourseRuleDto } from '../dto/UpsertCourseRuleDto';
import { UpsertActivityTypeRuleDto } from '../dto/UpsertActivityTypeRuleDto';

@Injectable()
export class CurriculaService {
  constructor(private curriculaRepository: CurriculaRepository) {}

  getAll(): Promise<CurriculumSummaryDto[]> {
    return this.curriculaRepository.getAll();
  }

  async getByYear(year: CurriculumYear): Promise<CurriculumResponseDto> {
    const curriculum = await this.curriculaRepository.findByYear(year);
    if (!curriculum) {
      throw new NotFoundException(`Currículo ${year} não encontrado`);
    }
    return curriculum;
  }

  async create(dto: CreateCurriculumDto): Promise<CreateCurriculumResponseDto> {
    const curriculum = await this.curriculaRepository.create(dto);
    return { message: 'Currículo criado com sucesso', curriculum };
  }

  async update(
    year: CurriculumYear,
    dto: UpdateCurriculumDto,
  ): Promise<UpdateCurriculumResponseDto> {
    const curriculum = await this.curriculaRepository.update(year, dto);
    return { message: 'Currículo atualizado com sucesso', curriculum };
  }

  async delete(year: CurriculumYear): Promise<DeleteCurriculumResponseDto> {
    await this.curriculaRepository.delete(year);
    return { message: 'Currículo removido com sucesso' };
  }

  async upsertCourseRule(
    year: CurriculumYear,
    course: Course,
    dto: UpsertCourseRuleDto,
  ): Promise<UpsertCourseRuleResponseDto> {
    const courseRule = await this.curriculaRepository.upsertCourseRule(
      year,
      course,
      dto,
    );
    return {
      message: 'Regra de curso atualizada com sucesso',
      courseRule,
    };
  }

  async deleteCourseRule(
    year: CurriculumYear,
    course: Course,
  ): Promise<DeleteCourseRuleResponseDto> {
    await this.curriculaRepository.deleteCourseRule(year, course);
    return { message: 'Regra de curso removida com sucesso' };
  }

  async upsertActivityTypeRule(
    year: CurriculumYear,
    cod: string,
    dto: UpsertActivityTypeRuleDto,
  ): Promise<UpsertActivityTypeRuleResponseDto> {
    const activityTypeRule =
      await this.curriculaRepository.upsertActivityTypeRule(year, cod, dto);
    return {
      message: 'Regra do tipo de atividade atualizada com sucesso',
      activityTypeRule,
    };
  }

  async deleteActivityTypeRule(
    year: CurriculumYear,
    cod: string,
  ): Promise<DeleteActivityTypeRuleResponseDto> {
    await this.curriculaRepository.deleteActivityTypeRule(year, cod);
    return { message: 'Regra do tipo de atividade removida com sucesso' };
  }
}
