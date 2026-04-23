import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { ActivitiesService } from '../../activities/services/activities.service';
import { CreateUserDto } from '../dto/CreateUserDto';
import { CreateUserResponseDto, UserResponseDto } from '../dto/UserResponseDto';
import { ActivityResponseDto } from '../../activities/dto/ActivityResponseDto';
import { UserSituation } from '../../enums/UserSituation';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private activitiesService: ActivitiesService,
  ) {}

  getAllUsers(situation?: UserSituation): Promise<UserResponseDto[]> {
    return this.usersRepository.getAll(situation);
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

  deleteUser(id: string): Promise<void> {
    return this.usersRepository.deleteUser(id);
  }

  async getUserActivities(userId: string): Promise<ActivityResponseDto[]> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return this.activitiesService.getActivitiesByUserId(userId);
  }
}
