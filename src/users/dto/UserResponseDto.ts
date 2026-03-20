export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UserSummaryDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string | null;
}

export interface CreateUserResponseDto {
  message: string;
  user: UserSummaryDto;
}
