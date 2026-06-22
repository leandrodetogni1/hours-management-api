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
import { CreateUserDto } from '../dto/CreateUserDto';
import { UpdateUserDto } from '../dto/UpdateUserDto';
import { CreateUserResponseDto, UserResponseDto } from '../dto/UserResponseDto';
import { ActivityResponseDto } from '../../activities/dto/ActivityResponseDto';
import { ActivitySummaryResponseDto } from '../../activities/dto/ActivitySummaryResponseDto';
import { PaginatedUsersResponseDto } from '../dto/PaginatedUsersResponseDto';
import { JwtUserPayload } from '../../auth/decorators/current-user.decorator';
import { Status } from '@prisma/client';

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

  deleteUser(id: string): Promise<void> {
    return this.usersRepository.deleteUser(id);
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
}
