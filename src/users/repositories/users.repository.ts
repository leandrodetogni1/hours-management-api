import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/CreateUserDto';

export const users = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'jhon@doe.com',
  },
];

@Injectable()
export class UsersRepository {
  findById(id: string) {
    return users.find((user) => user.id === id);
  }

  createUser(user: CreateUserDto) {
    const newUser = {
      id: (users.length + 1).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    users.push(newUser);

    return newUser;
  }
}
