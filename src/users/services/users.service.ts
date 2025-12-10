import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { CreateUserDto } from '../dto/CreateUserDto';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  getAllUsers() {
    return this.usersRepository.getAll();
  }

  getUserById(id: string) {
    return this.usersRepository.findById(id);
  }

  createUser(user: CreateUserDto) {
    return this.usersRepository.createUser(user);
  }
}
