import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/CreateUserDto';
import { UpdateUserDto } from '../dto/UpdateUserDto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { CreateUserResponseDto, UserResponseDto } from '../dto/UserResponseDto';
import { UserMapper } from '../mappers/user.mapper';
import { UserCourse } from '../../enums/UserCourse';
import { UserSituation } from '../../enums/UserSituation';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  private throwP2002(error: Prisma.PrismaClientKnownRequestError): never {
    const target = (error.meta?.target as string[] | undefined) ?? [];
    const cause = String(
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      (error.meta as Record<string, unknown>)?.driverAdapterError ?? '',
    );
    const isMatricula = target.includes('matricula') || cause.includes('matricula');
    throw new ConflictException(
      isMatricula ? 'Matrícula já cadastrada' : 'Email já cadastrado',
    );
  }

  async getAll(situation?: UserSituation): Promise<UserResponseDto[]> {
    const users = await this.prisma.users.findMany({
      where: situation ? { situation } : undefined,
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
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          matricula: user.matricula,
          situation: user.situation ?? null,
          course: user.course ?? null,
          role: { connect: { name: 'member' } },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          matricula: true,
          situation: true,
          course: true,
          role: { select: { name: true } },
        },
      });

      return {
        message: 'User created successfully',
        user: UserMapper.toSummaryDto({
          ...createdUser,
          situation: createdUser.situation as UserSituation | null,
          course: createdUser.course as UserCourse | null,
        }),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.throwP2002(error);
      }
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<UserResponseDto> {
    const existing = await this.prisma.users.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (data.matricula !== undefined) {
      const conflict = await this.prisma.users.findUnique({
        where: { matricula: data.matricula },
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException('Matrícula já cadastrada');
      }
    }

    try {
      const updated = await this.prisma.users.update({
        where: { id },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.matricula !== undefined && { matricula: data.matricula }),
          ...(data.situation !== undefined && { situation: data.situation }),
          ...(data.course !== undefined && { course: data.course }),
          updatedAt: new Date(),
        },
        include: { role: true },
      });

      return UserMapper.toResponseDto(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.throwP2002(error);
      }
      throw error;
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
