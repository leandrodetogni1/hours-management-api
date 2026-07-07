import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GetAllUsersOptions,
  UsersRepository,
} from '../repositories/users.repository';
import { ActivitiesService } from '../../activities/services/activities.service';
import { CurriculaRepository } from '../../curricula/repositories/curricula.repository';
import { CreateUserDto } from '../dto/CreateUserDto';
import { UpdateUserDto } from '../dto/UpdateUserDto';
import { CreateUserResponseDto, UserResponseDto } from '../dto/UserResponseDto';
import { ActivityResponseDto } from '../../activities/dto/ActivityResponseDto';
import { ActivitySummaryResponseDto } from '../../activities/dto/ActivitySummaryResponseDto';
import { PaginatedUsersResponseDto } from '../dto/PaginatedUsersResponseDto';
import {
  FormandoAptoItemDto,
  FormandosAptosResponseDto,
} from '../dto/FormandoAptoResponseDto';
import { JwtUserPayload } from '../../auth/decorators/current-user.decorator';
import {
  ActivityClass,
  Category,
  CurriculumYear,
  Status,
} from '@prisma/client';
import { calculateActivityProgress } from '../../activities/domain/progress-calculator';
import { CurriculumRules } from '../../activities/domain/curriculum-rules';
import { ProgressActivity } from '../../activities/domain/progress-calculator';

export interface DeletedUserSnapshot {
  firstName: string;
  lastName: string;
  email: string;
}

const PRIVILEGED_UPDATE_ROLES = ['owner', 'admin'] as const;
const SELF_EDITABLE_FIELDS = [
  'firstName',
  'lastName',
  'course',
  'curriculumYear',
  'situation',
  'picture',
] as const;

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private activitiesService: ActivitiesService,
    private curriculaRepository: CurriculaRepository,
  ) {}

  getAllUsers(options: GetAllUsersOptions): Promise<PaginatedUsersResponseDto> {
    return this.usersRepository.getAll(options);
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  createUser(user: CreateUserDto): Promise<CreateUserResponseDto> {
    return this.usersRepository.createUser(user);
  }

  async updateUser(
    id: string,
    data: UpdateUserDto,
    currentUser: JwtUserPayload,
  ): Promise<UserResponseDto> {
    const isPrivileged =
      typeof currentUser.role === 'string' &&
      (PRIVILEGED_UPDATE_ROLES as readonly string[]).includes(currentUser.role);

    if (!isPrivileged) {
      if (currentUser.sub !== id) {
        throw new ForbiddenException(
          'Apenas o próprio usuário ou owner/admin podem atualizar este registro',
        );
      }

      const current = await this.usersRepository.findById(id);
      if (!current) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      const selfEditable = new Set<string>(SELF_EDITABLE_FIELDS);
      const settingOwnInitialMatricula =
        data.matricula !== undefined &&
        (!current.matricula || data.matricula === current.matricula);
      if (settingOwnInitialMatricula) {
        selfEditable.add('matricula');
      }

      const disallowed = Object.keys(data).filter(
        (key) =>
          data[key as keyof UpdateUserDto] !== undefined &&
          !selfEditable.has(key),
      );
      if (disallowed.length > 0) {
        throw new ForbiddenException(
          `Apenas owner/admin podem alterar: ${disallowed.join(', ')}`,
        );
      }
    }

    return this.usersRepository.updateUser(id, data);
  }

  async deleteUser(id: string): Promise<DeletedUserSnapshot> {
    const user = await this.getUserById(id);
    await this.usersRepository.deleteUser(id);
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
  }

  async getUserActivities(
    userId: string,
    status?: Status,
  ): Promise<ActivityResponseDto[]> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return this.activitiesService.getActivitiesByUserId(userId, status);
  }

  async getUserActivitiesSummary(
    userId: string,
  ): Promise<ActivitySummaryResponseDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return this.activitiesService.getSummaryByUserId(userId);
  }

  async getFormandosAptos(): Promise<FormandosAptosResponseDto> {
    const students = await this.usersRepository.findFormandosWithActivities();

    const curriculumYears = [
      ...new Set(students.map((s) => s.curriculumYear).filter(Boolean)),
    ] as CurriculumYear[];
    const rulesMap = new Map<CurriculumYear, CurriculumRules>();
    for (const year of curriculumYears) {
      const rules = await this.curriculaRepository.findRulesByYear(year);
      if (rules) rulesMap.set(year, rules);
    }

    const items: FormandoAptoItemDto[] = [];
    for (const student of students) {
      const rules = student.curriculumYear
        ? (rulesMap.get(student.curriculumYear) ?? null)
        : null;
      const activities: ProgressActivity[] = student.activities.map((a) => ({
        status: a.status,
        class: a.class,
        hoursEquivalent: a.hoursEquivalent?.toNumber() ?? 0,
        activityType: a.activity_types
          ? {
              id: a.activity_types.id,
              cod: a.activity_types.cod,
              label: a.activity_types.label,
              category: a.activity_types.category,
              curriculumRules: a.activity_types.curriculumRules,
            }
          : null,
      }));

      const progress = calculateActivityProgress({
        curriculumRules: rules,
        course: student.course,
        activities,
      });
      if (!progress.isReadyToGraduate) continue;

      items.push({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        matricula: student.matricula,
        course: student.course,
        curriculumYear: student.curriculumYear,
        hoursEnsino: progress.approvedHoursByCategory[Category.ENSINO],
        hoursPesquisa: progress.approvedHoursByCategory[Category.PESQUISA],
        hoursExtensao: progress.approvedHoursByCategory[Category.EXTENSAO],
        hoursComplementar:
          progress.approvedHoursByClass[ActivityClass.COMPLEMENTAR],
        hoursLivre: progress.approvedHoursByClass[ActivityClass.LIVRE],
        totalHoursApproved: progress.totalHoursApproved,
      });
    }

    items.sort((a, b) => a.firstName.localeCompare(b.firstName));
    return { items, total: items.length };
  }
}
