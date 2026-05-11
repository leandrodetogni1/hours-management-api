import { users, roles } from '@prisma/client';
import { UserResponseDto, UserSummaryDto } from '../dto/UserResponseDto';
import { CurriculumYear } from '../../enums/CurriculumYear';
import { UserCourse } from '../../enums/UserCourse';
import { UserSituation } from '../../enums/UserSituation';

type UserWithRole = users & { role: roles };

export class UserMapper {
  static toResponseDto(user: UserWithRole): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture ?? null,
      role: user.role.name,
      matricula: user.matricula ?? null,
      situation: (user.situation as UserSituation) ?? null,
      course: (user.course as UserCourse) ?? null,
      curriculumYear: (user.curriculumYear as CurriculumYear) ?? null,
      createdAt: user.createdAt?.toISOString() ?? null,
      updatedAt: user.updatedAt?.toISOString() ?? null,
    };
  }

  static toSummaryDto(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    picture: string | null;
    role: { name: string };
    matricula: string | null;
    situation: UserSituation | null;
    course: UserCourse | null;
    curriculumYear: CurriculumYear | null;
  }): UserSummaryDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture ?? null,
      role: user.role.name,
      matricula: user.matricula ?? null,
      situation: user.situation ?? null,
      course: user.course ?? null,
      curriculumYear: user.curriculumYear ?? null,
    };
  }
}
