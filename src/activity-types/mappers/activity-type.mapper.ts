import { ActivityTypeResponseDto } from '../dto/ActivityTypeResponseDto';

export class ActivityTypeMapper {
  static toResponseDto(activityType: {
    id: string;
    cod: string;
    label: string;
    maxHoursInComplementarActivities: number | null;
    maxHoursPerCertificateOrSemester: number | null;
    category: string | null;
    unity: string | null;
  }): ActivityTypeResponseDto {
    return {
      id: activityType.id,
      cod: activityType.cod,
      label: activityType.label,
      maxHoursInComplementarActivities:
        activityType.maxHoursInComplementarActivities,
      maxHoursPerCertificateOrSemester:
        activityType.maxHoursPerCertificateOrSemester,
      category: activityType.category,
      unity: activityType.unity,
    };
  }
}
