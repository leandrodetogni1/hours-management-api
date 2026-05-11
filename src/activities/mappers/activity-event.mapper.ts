import { ActivityEventResponseDto } from '../dto/ActivityEventResponseDto';

export class ActivityEventMapper {
  static toResponseDto(event: {
    id: string;
    activityId: string;
    fromStatus: string | null;
    toStatus: string;
    actorId: string;
    comment: string | null;
    createdAt: Date;
    actor?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      picture: string | null;
    } | null;
  }): ActivityEventResponseDto {
    return {
      id: event.id,
      activityId: event.activityId,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      actorId: event.actorId,
      actor: event.actor ?? null,
      comment: event.comment,
      createdAt: event.createdAt.toISOString(),
    };
  }
}
