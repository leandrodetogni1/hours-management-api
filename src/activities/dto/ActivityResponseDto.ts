import { ActivityTypeSummaryDto } from 'src/activity-types/dto/ActivityTypeResponseDto';

export interface ActivityUserSummaryDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ActivityResponseDto {
  id: string;
  authorId: string | null;
  unity: string | null;
  status: string | null;
  category: string | null;
  class: string | null;
  activityTypeId: string | null;
  event: string | null;
  organization: string | null;
  hours: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  users: ActivityUserSummaryDto | null;
  activity_types: ActivityTypeSummaryDto | null;
}

export interface CreateActivityResponseDto {
  message: string;
  activity: ActivityResponseDto;
}

export interface UpdateActivityStatusResponseDto {
  message: string;
  activity: ActivityResponseDto;
}
