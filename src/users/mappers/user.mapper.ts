import { users } from '@prisma/client';
import { UserResponseDto, UserSummaryDto } from '../dto/UserResponseDto';

export class UserMapper {
  static toResponseDto(user: users): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt?.toISOString() ?? null,
      updatedAt: user.updatedAt?.toISOString() ?? null,
    };
  }

  static toSummaryDto(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string | null;
  }): UserSummaryDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}
