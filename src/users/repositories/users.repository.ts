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
import { RawUserRow, UserMapper } from '../mappers/user.mapper';
import { CurriculumYear } from '../../enums/CurriculumYear';
import { UserCourse } from '../../enums/UserCourse';
import { UserSituation } from '../../enums/UserSituation';
import {
  FilterableRole,
  SortableUserField,
  SortOrder,
} from '../dto/GetUsersQueryDto';
import { PaginatedUsersResponseDto } from '../dto/PaginatedUsersResponseDto';

export interface GetAllUsersOptions {
  situation?: UserSituation;
  role?: FilterableRole;
  course?: UserCourse;
  search?: string;
  page: number;
  pageSize: number;
  sortBy: SortableUserField;
  sortOrder: SortOrder;
}

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  private throwP2002(error: Prisma.PrismaClientKnownRequestError): never {
    const target = (error.meta?.target as string[] | undefined) ?? [];
    const cause = String(
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      (error.meta as Record<string, unknown>)?.driverAdapterError ?? '',
    );
    const isMatricula =
      target.includes('matricula') || cause.includes('matricula');
    throw new ConflictException(
      isMatricula ? 'Matrícula já cadastrada' : 'Email já cadastrado',
    );
  }

  async getAll(
    options: GetAllUsersOptions,
  ): Promise<PaginatedUsersResponseDto> {
    const {
      situation,
      role,
      course,
      search,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = options;

    if (sortBy === 'situation') {
      return this.getAllOrderedBySituation(options);
    }

    const where: Prisma.usersWhereInput = {
      ...(situation && { situation }),
      ...(role && { role: { name: role } }),
      ...(course && { course }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { matricula: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.usersOrderByWithRelationInput[] =
      sortBy === 'fullName'
        ? [{ firstName: sortOrder }, { lastName: sortOrder }]
        : [{ [sortBy]: sortOrder }];

    const [users, total] = await this.prisma.$transaction([
      this.prisma.users.findMany({
        where,
        include: { role: true },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      items: users.map((user) => UserMapper.toResponseDto(user)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  private async getAllOrderedBySituation(
    options: GetAllUsersOptions,
  ): Promise<PaginatedUsersResponseDto> {
    const { situation, role, course, search, page, pageSize, sortOrder } =
      options;

    const conditions: Prisma.Sql[] = [];
    if (situation) {
      conditions.push(Prisma.sql`u.situation = ${situation}::"UserSituation"`);
    }
    if (role) {
      conditions.push(Prisma.sql`r.name = ${role}`);
    }
    if (course) {
      conditions.push(Prisma.sql`u.course = ${course}::"Course"`);
    }
    if (search) {
      const term = `%${search}%`;
      conditions.push(
        Prisma.sql`(u.firstname ILIKE ${term} OR u.lastname ILIKE ${term} OR u.email ILIKE ${term} OR u.matricula ILIKE ${term})`,
      );
    }
    const whereSql = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    const direction = sortOrder === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`;
    const situationPriority = Prisma.sql`array_position(ARRAY['FORMANDO', 'REGULAR', 'FORMADO']::"UserSituation"[], u.situation)`;

    const rows = await this.prisma.$queryRaw<RawUserRow[]>(Prisma.sql`
      SELECT
        u.id,
        u.email,
        u.firstname AS "firstName",
        u.lastname AS "lastName",
        u.picture,
        u.matricula,
        u.situation,
        u.course,
        u.curriculumyear AS "curriculumYear",
        u.createdat AS "createdAt",
        u.updatedat AS "updatedAt",
        r.name AS "roleName"
      FROM users u
      INNER JOIN roles r ON r.id = u.roleid
      ${whereSql}
      ORDER BY ${situationPriority} ${direction} NULLS LAST, u.firstname ASC, u.lastname ASC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `);

    const countResult = await this.prisma.$queryRaw<{ total: number }[]>(
      Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM users u
      INNER JOIN roles r ON r.id = u.roleid
      ${whereSql}
    `,
    );
    const total = countResult[0]?.total ?? 0;

    return {
      items: rows.map((row) => UserMapper.fromRawRow(row)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
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
          curriculumYear: user.curriculumYear ?? null,
          role: { connect: { name: 'member' } },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          picture: true,
          matricula: true,
          situation: true,
          course: true,
          curriculumYear: true,
          role: { select: { name: true } },
        },
      });

      return {
        message: 'User created successfully',
        user: UserMapper.toSummaryDto({
          ...createdUser,
          situation: createdUser.situation as UserSituation | null,
          course: createdUser.course as UserCourse | null,
          curriculumYear: createdUser.curriculumYear as CurriculumYear | null,
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
          ...(data.curriculumYear !== undefined && {
            curriculumYear: data.curriculumYear,
          }),
          ...(data.picture !== undefined && { picture: data.picture }),
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
