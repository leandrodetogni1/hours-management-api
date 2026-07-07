import { Status } from '@prisma/client';
import { validateStatusTransition } from '../../src/activities/domain/status-transition';

describe('validateStatusTransition', () => {
  describe('same-status transitions are blocked regardless of override', () => {
    const cases: Array<{ status: Status; override: boolean }> = [
      { status: Status.PENDING, override: false },
      { status: Status.VERIFIED, override: false },
      { status: Status.APPROVED, override: true },
      { status: Status.APPROVED, override: false },
      { status: Status.REJECTED, override: true },
    ];

    it.each(cases)(
      '$status → $status (override=$override) is blocked',
      ({ status, override }) => {
        const result = validateStatusTransition({
          currentStatus: status,
          targetStatus: status,
          overrideTransitionRules: override,
        });
        expect(result).toEqual({
          allowed: false,
          reason: `A atividade já está com o status ${status}`,
        });
      },
    );
  });

  describe('standard rules (override=false)', () => {
    const allowed: Array<{ from: Status; to: Status }> = [
      { from: Status.PENDING, to: Status.VERIFIED },
      { from: Status.PENDING, to: Status.APPROVED },
      { from: Status.PENDING, to: Status.REJECTED },
      { from: Status.VERIFIED, to: Status.APPROVED },
      { from: Status.VERIFIED, to: Status.REJECTED },
    ];

    it.each(allowed)('$from → $to is allowed', ({ from, to }) => {
      const result = validateStatusTransition({
        currentStatus: from,
        targetStatus: to,
        overrideTransitionRules: false,
      });
      expect(result).toEqual({ allowed: true });
    });

    const blocked: Array<{ from: Status; to: Status }> = [
      { from: Status.APPROVED, to: Status.REJECTED },
      { from: Status.REJECTED, to: Status.APPROVED },
      { from: Status.APPROVED, to: Status.VERIFIED },
      { from: Status.REJECTED, to: Status.VERIFIED },
      { from: Status.VERIFIED, to: Status.PENDING },
    ];

    it.each(blocked)('$from → $to is blocked', ({ from, to }) => {
      const result = validateStatusTransition({
        currentStatus: from,
        targetStatus: to,
        overrideTransitionRules: false,
      });
      expect(result).toEqual({
        allowed: false,
        reason: `Não é possível alterar o status de ${from} para ${to}`,
      });
    });

    it('reports the exact Portuguese message for APPROVED → REJECTED', () => {
      const result = validateStatusTransition({
        currentStatus: Status.APPROVED,
        targetStatus: Status.REJECTED,
        overrideTransitionRules: false,
      });
      expect(result).toEqual({
        allowed: false,
        reason: 'Não é possível alterar o status de APPROVED para REJECTED',
      });
    });
  });

  describe('override (owner/admin) allows any different-status transition', () => {
    const cases: Array<{ from: Status; to: Status }> = [
      { from: Status.APPROVED, to: Status.REJECTED },
      { from: Status.REJECTED, to: Status.APPROVED },
      { from: Status.APPROVED, to: Status.VERIFIED },
      { from: Status.REJECTED, to: Status.VERIFIED },
      { from: Status.VERIFIED, to: Status.REJECTED },
      { from: Status.PENDING, to: Status.APPROVED },
    ];

    it.each(cases)('$from → $to is allowed', ({ from, to }) => {
      const result = validateStatusTransition({
        currentStatus: from,
        targetStatus: to,
        overrideTransitionRules: true,
      });
      expect(result).toEqual({ allowed: true });
    });
  });
});
