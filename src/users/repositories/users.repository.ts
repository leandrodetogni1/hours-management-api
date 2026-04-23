import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/CreateUserDto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { CreateUserResponseDto, UserResponseDto } from '../dto/UserResponseDto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.users.findMany({
      include: { role: true },
    });
    return users.map((user) => UserMapper.toResponseDto(user));
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.users.findUnique({
      where: { id },
      include: { role: true },
    });
    return user ? UserMapper.toResponseDto(user) : null;
  }

  async createUser(user: CreateUserDto): Promise<CreateUserResponseDto> {
    try {
      const createdUser = await this.prisma.users.create({
        data: {
          ...user,
          role: { connect: { name: 'MEMBER' } },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: { select: { name: true } },
        },
      });

      return {
        message: 'User created successfully',
        user: UserMapper.toSummaryDto(createdUser),
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

  async deleteUser(id: string): Promise<void> {
    const user = await this.prisma.users.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.prisma.$transaction([
      this.prisma.activities.deleteMany({ where: { authorId: id } }),
      this.prisma.users.delete({ where: { id } }),
    ]);
  }
}
