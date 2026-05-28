import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Course, CurriculumYear } from '@prisma/client';
import { CurriculaService } from './services/curricula.service.js';
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
} from './dto/CurriculumResponseDto.js';
import { CreateCurriculumDto } from './dto/CreateCurriculumDto.js';
import { UpdateCurriculumDto } from './dto/UpdateCurriculumDto.js';
import { UpsertCourseRuleDto } from './dto/UpsertCourseRuleDto.js';
import { UpsertActivityTypeRuleDto } from './dto/UpsertActivityTypeRuleDto.js';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator.js';

const OWNER_ONLY = ['owner'];

const YEAR_PARAM = {
  name: 'year',
  description: 'Ano do currículo (ex.: Y2015)',
};
const COURSE_PARAM = {
  name: 'course',
  description: 'Curso (ex.: CIENCIA_DA_COMPUTACAO)',
};
const COD_PARAM = { name: 'cod', description: 'Código do tipo de atividade' };

function parseCurriculumYear(value: string): CurriculumYear {
  const allowed = Object.values(CurriculumYear);
  if (!allowed.includes(value as CurriculumYear)) {
    throw new BadRequestException(
      `Ano de currículo inválido. Use: ${allowed.join(', ')}`,
    );
  }
  return value as CurriculumYear;
}

function parseCourse(value: string): Course {
  const allowed = Object.values(Course);
  if (!allowed.includes(value as Course)) {
    throw new BadRequestException(`Curso inválido. Use: ${allowed.join(', ')}`);
  }
  return value as Course;
}

@ApiTags('Curricula')
@ApiBearerAuth()
@Controller('curricula')
export class CurriculaController {
  constructor(private curriculaService: CurriculaService) {}

  @Get()
  @ApiEndpoint({
    summary: 'Listar currículos',
    description: 'Lista de currículos cadastrados com regras globais',
    type: CurriculumSummaryDto,
    isArray: true,
  })
  findAll(): Promise<CurriculumSummaryDto[]> {
    return this.curriculaService.getAll();
  }

  @Get(':year')
  @ApiEndpoint({
    summary: 'Buscar currículo por ano',
    description:
      'Currículo completo com regras globais, regras por curso e regras por tipo de atividade',
    type: CurriculumResponseDto,
    params: [YEAR_PARAM],
  })
  findByYear(@Param('year') year: string): Promise<CurriculumResponseDto> {
    return this.curriculaService.getByYear(parseCurriculumYear(year));
  }

  @Post()
  @ApiEndpoint({
    summary: 'Criar currículo (owner)',
    status: HttpStatus.CREATED,
    description: 'Currículo criado',
    type: CreateCurriculumResponseDto,
    roles: OWNER_ONLY,
    hasBody: true,
  })
  create(
    @Body() body: CreateCurriculumDto,
  ): Promise<CreateCurriculumResponseDto> {
    return this.curriculaService.create(body);
  }

  @Patch(':year')
  @ApiEndpoint({
    summary: 'Atualizar regras globais de um currículo (owner)',
    description: 'Currículo atualizado',
    type: UpdateCurriculumResponseDto,
    params: [YEAR_PARAM],
    roles: OWNER_ONLY,
    hasBody: true,
  })
  update(
    @Param('year') year: string,
    @Body() body: UpdateCurriculumDto,
  ): Promise<UpdateCurriculumResponseDto> {
    return this.curriculaService.update(parseCurriculumYear(year), body);
  }

  @Delete(':year')
  @ApiEndpoint({
    summary: 'Remover currículo (owner)',
    description: 'Currículo removido',
    type: DeleteCurriculumResponseDto,
    params: [YEAR_PARAM],
    roles: OWNER_ONLY,
  })
  delete(@Param('year') year: string): Promise<DeleteCurriculumResponseDto> {
    return this.curriculaService.delete(parseCurriculumYear(year));
  }

  @Put(':year/course-rules/:course')
  @ApiEndpoint({
    summary: 'Upsert de regra por curso (owner)',
    description: 'Regra de curso criada ou atualizada',
    type: UpsertCourseRuleResponseDto,
    params: [YEAR_PARAM, COURSE_PARAM],
    roles: OWNER_ONLY,
    hasBody: true,
  })
  upsertCourseRule(
    @Param('year') year: string,
    @Param('course') course: string,
    @Body() body: UpsertCourseRuleDto,
  ): Promise<UpsertCourseRuleResponseDto> {
    return this.curriculaService.upsertCourseRule(
      parseCurriculumYear(year),
      parseCourse(course),
      body,
    );
  }

  @Delete(':year/course-rules/:course')
  @ApiEndpoint({
    summary: 'Remover regra de curso do currículo (owner)',
    description: 'Regra de curso removida',
    type: DeleteCourseRuleResponseDto,
    params: [YEAR_PARAM, COURSE_PARAM],
    roles: OWNER_ONLY,
  })
  deleteCourseRule(
    @Param('year') year: string,
    @Param('course') course: string,
  ): Promise<DeleteCourseRuleResponseDto> {
    return this.curriculaService.deleteCourseRule(
      parseCurriculumYear(year),
      parseCourse(course),
    );
  }

  @Put(':year/activity-type-rules/:cod')
  @ApiEndpoint({
    summary: 'Upsert de regra por tipo de atividade (owner)',
    description: 'Regra do tipo de atividade criada ou atualizada',
    type: UpsertActivityTypeRuleResponseDto,
    params: [YEAR_PARAM, COD_PARAM],
    roles: OWNER_ONLY,
    hasBody: true,
  })
  upsertActivityTypeRule(
    @Param('year') year: string,
    @Param('cod') cod: string,
    @Body() body: UpsertActivityTypeRuleDto,
  ): Promise<UpsertActivityTypeRuleResponseDto> {
    return this.curriculaService.upsertActivityTypeRule(
      parseCurriculumYear(year),
      cod,
      body,
    );
  }

  @Delete(':year/activity-type-rules/:cod')
  @ApiEndpoint({
    summary: 'Remover regra do tipo de atividade do currículo (owner)',
    description: 'Regra do tipo de atividade removida',
    type: DeleteActivityTypeRuleResponseDto,
    params: [YEAR_PARAM, COD_PARAM],
    roles: OWNER_ONLY,
  })
  deleteActivityTypeRule(
    @Param('year') year: string,
    @Param('cod') cod: string,
  ): Promise<DeleteActivityTypeRuleResponseDto> {
    return this.curriculaService.deleteActivityTypeRule(
      parseCurriculumYear(year),
      cod,
    );
  }
}
