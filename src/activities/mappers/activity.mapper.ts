import { ActivityResponseDto } from '../dto/ActivityResponseDto';

export class ActivityMapper {
  static toResponseDto(activity: {
    id: string;
    authorId: string | null;
    status: string | null;
    class: string | null;
    activityTypeId: string | null;
    event: string | null;
    organization: string | null;
    hours: { toNumber(): number } | null;
    hoursEquivalent: { toNumber(): number } | null;
    certificateUrl: string | null;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    users: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      picture: string | null;
    } | null;
    activity_types: {
      id: string;
      cod: string;
      label: string;
      category: string | null;
      unity: string | null;
    } | null;
  }): ActivityResponseDto {
    return {
      id: activity.id,
      authorId: activity.authorId,
      status: activity.status,
      class: activity.class,
      activityTypeId: activity.activityTypeId,
      event: activity.event,
      organization: activity.organization,
      hours: activity.hours?.toNumber() ?? null,
      hoursEquivalent: activity.hoursEquivalent?.toNumber() ?? null,
      certificateUrl: activity.certificateUrl,
      startDate: activity.startDate?.toISOString() ?? null,
      endDate: activity.endDate?.toISOString() ?? null,
      createdAt: activity.createdAt?.toISOString() ?? null,
      updatedAt: activity.updatedAt?.toISOString() ?? null,
      users: activity.users,
      activity_types: activity.activity_types,
    };
  }
}
