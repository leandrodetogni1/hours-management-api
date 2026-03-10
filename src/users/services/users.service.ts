import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { CreateUserDto } from '../dto/CreateUserDto';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  getAllUsers() {
    return this.usersRepository.getAll();
  }

  async getUserById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  createUser(user: CreateUserDto) {
    return this.usersRepository.createUser(user);
  }
}
