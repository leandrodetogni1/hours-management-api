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
