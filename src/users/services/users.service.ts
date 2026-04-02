import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { CreateUserDto } from '../dto/CreateUserDto';
import { CreateUserResponseDto, UserResponseDto } from '../dto/UserResponseDto';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  getAllUsers(): Promise<UserResponseDto[]> {
    return this.usersRepository.getAll();
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
}
