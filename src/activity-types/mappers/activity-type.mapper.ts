import { ActivityTypeResponseDto } from '../dto/ActivityTypeResponseDto';

export class ActivityTypeMapper {
  static toResponseDto(activityType: {
    id: string;
    cod: string;
    label: string;
    category: string | null;
    unity: string | null;
  }): ActivityTypeResponseDto {
    return {
      id: activityType.id,
      cod: activityType.cod,
      label: activityType.label,
      category: activityType.category,
      unity: activityType.unity,
    };
  }
}
