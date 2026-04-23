import { users, roles } from '@prisma/client';
import { UserResponseDto, UserSummaryDto } from '../dto/UserResponseDto';

type UserWithRole = users & { role: roles };

export class UserMapper {
  static toResponseDto(user: UserWithRole): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      createdAt: user.createdAt?.toISOString() ?? null,
      updatedAt: user.updatedAt?.toISOString() ?? null,
    };
  }

  static toSummaryDto(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: { name: string };
  }): UserSummaryDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
    };
  }
}
