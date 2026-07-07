import { Status } from '@prisma/client';

const allowedSourceStatuses: Record<Status, Status[]> = {
  [Status.PENDING]: [],
  [Status.VERIFIED]: [Status.PENDING],
  [Status.APPROVED]: [Status.PENDING, Status.VERIFIED],
  [Status.REJECTED]: [Status.PENDING, Status.VERIFIED],
};

export interface StatusTransitionInput {
  currentStatus: Status;
  targetStatus: Status;
  overrideTransitionRules: boolean;
}

export type StatusTransitionResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export function validateStatusTransition({
  currentStatus,
  targetStatus,
  overrideTransitionRules,
}: StatusTransitionInput): StatusTransitionResult {
  if (currentStatus === targetStatus) {
    return {
      allowed: false,
      reason: `A atividade já está com o status ${currentStatus}`,
    };
  }

  if (overrideTransitionRules) {
    return { allowed: true };
  }

  if (!allowedSourceStatuses[targetStatus].includes(currentStatus)) {
    return {
      allowed: false,
      reason: `Não é possível alterar o status de ${currentStatus} para ${targetStatus}`,
    };
  }

  return { allowed: true };
}
