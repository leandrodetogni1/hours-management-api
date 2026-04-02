export interface ActivityTypeResponseDto {
  id: string;
  cod: string;
  label: string;
  maxHoursInComplementarActivities: number | null;
  maxHoursPerCertificateOrSemester: number | null;
  category: string | null;
  unity: string | null;
}

export interface ActivityTypeSummaryDto {
  id: string;
  cod: string;
  label: string;
}

export interface CreateActivityTypeResponseDto {
  message: string;
  activityType: ActivityTypeResponseDto;
}

export interface UpdateActivityTypeResponseDto {
  message: string;
  activityType: ActivityTypeResponseDto;
}

export interface DeleteActivityTypeResponseDto {
  message: string;
}
