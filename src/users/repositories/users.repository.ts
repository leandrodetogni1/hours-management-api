import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/CreateUserDto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  getAll() {
    return this.prisma.users.findMany();
  }

  findById(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
    });
  }

  async createUser(user: CreateUserDto, userRole: string = 'member') {
    const role = await this.prisma.roles.findFirst({
      where: {
        name: userRole,
      },
      select: { id: true },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    try {
      const createdUser = await this.prisma.users.create({
        data: {
          ...user,
          roleId: role.id,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      return {
        message: 'User created successfully',
        user: createdUser,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
      }
      throw new Error(`Failed to create user: ${error}`);
    }
  }
}
