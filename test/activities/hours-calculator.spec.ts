import { ActivityClass, Unity } from '@prisma/client';
import {
  calculateHoursEquivalent,
  semestersBetween,
} from '../../src/activities/domain/hours-calculator';

describe('calculateHoursEquivalent', () => {
  describe('planilha ground truth (real rows from panilha.xlsx)', () => {
    const cases: Array<{
      row: string;
      cod: string;
      cls: ActivityClass;
      start: string;
      end: string;
      quantity: number | null;
      maxPerCert: number;
      unity: Unity;
      expected: number;
    }> = [
      {
        row: 'R12',
        cod: 'F',
        cls: ActivityClass.COMPLEMENTAR,
        start: '2015-10-05',
        end: '2015-10-09',
        quantity: 8,
        maxPerCert: 34,
        unity: Unity.HORAS,
        expected: 8,
      },
      {
        row: 'R13',
        cod: 'F',
        cls: ActivityClass.COMPLEMENTAR,
        start: '2018-11-05',
        end: '2018-11-09',
        quantity: 20,
        maxPerCert: 34,
        unity: Unity.HORAS,
        expected: 20,
      },
      {
        row: 'R15',
        cod: 'H1',
        cls: ActivityClass.COMPLEMENTAR,
        start: '2024-11-25',
        end: '2024-11-29',
        quantity: 40,
        maxPerCert: 17,
        unity: Unity.UNIDADE,
        expected: 17,
      },
      {
        row: 'R16',
        cod: 'G',
        cls: ActivityClass.COMPLEMENTAR,
        start: '2024-10-09',
        end: '2025-07-24',
        quantity: 51,
        maxPerCert: 51,
        unity: Unity.HORAS,
        expected: 51,
      },
      {
        row: 'R17',
        cod: 'G',
        cls: ActivityClass.COMPLEMENTAR,
        start: '2025-06-16',
        end: '2025-08-10',
        quantity: 30,
        maxPerCert: 51,
        unity: Unity.HORAS,
        expected: 30,
      },
      {
        row: 'R18',
        cod: 'G',
        cls: ActivityClass.COMPLEMENTAR,
        start: '2025-07-20',
        end: '2025-08-08',
        quantity: 17.5,
        maxPerCert: 51,
        unity: Unity.HORAS,
        expected: 17.5,
      },
      {
        row: 'R19',
        cod: 'H1',
        cls: ActivityClass.COMPLEMENTAR,
        start: '2025-10-20',
        end: '2025-10-24',
        quantity: 40,
        maxPerCert: 17,
        unity: Unity.UNIDADE,
        expected: 17,
      },
      {
        row: 'R20',
        cod: 'F',
        cls: ActivityClass.COMPLEMENTAR,
        start: '2025-08-04',
        end: '2025-08-08',
        quantity: 40,
        maxPerCert: 34,
        unity: Unity.HORAS,
        expected: 34,
      },
      {
        row: 'R21',
        cod: 'B',
        cls: ActivityClass.COMPLEMENTAR,
        start: '2019-08-01',
        end: '2020-07-31',
        quantity: null,
        maxPerCert: 51,
        unity: Unity.SEMESTRE,
        expected: 102,
      },
    ];

    it.each(cases)(
      '$row cod=$cod qty=$quantity → $expected',
      ({ cls, cod, start, end, quantity, maxPerCert, unity, expected }) => {
        const got = calculateHoursEquivalent(
          {
            class: cls,
            startDate: new Date(start),
            endDate: new Date(end),
            quantity,
          },
          { cod, unity, maxHoursPerCertificateOrSemester: maxPerCert },
        );
        expect(got).toBeCloseTo(expected, 2);
      },
    );
  });

  describe('per-type rules from the PDF', () => {
    it('type A (Monitorias) auto-calculates from dates like B/C/D/J (per PDF)', () => {
      const got = calculateHoursEquivalent(
        {
          class: ActivityClass.COMPLEMENTAR,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          quantity: null,
        },
        {
          cod: 'A',
          unity: Unity.SEMESTRE,
          maxHoursPerCertificateOrSemester: 51,
        },
      );
      expect(got).toBeCloseTo(102, 2);
    });

    it('hours-cap types (E/F/G/L) cap quantity at maxPerCert', () => {
      const got = calculateHoursEquivalent(
        {
          class: ActivityClass.COMPLEMENTAR,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-02'),
          quantity: 999,
        },
        { cod: 'L', unity: Unity.HORAS, maxHoursPerCertificateOrSemester: 51 },
      );
      expect(got).toBe(51);
    });

    it('per-occurrence types (I1/I2/I3/K) award full K when quantity > 0', () => {
      const got = calculateHoursEquivalent(
        {
          class: ActivityClass.COMPLEMENTAR,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-02'),
          quantity: 1,
        },
        {
          cod: 'K',
          unity: Unity.UNIDADE,
          maxHoursPerCertificateOrSemester: 68,
        },
      );
      expect(got).toBe(68);
    });

    it('per-occurrence types award 0 when quantity is 0 or null', () => {
      const got = calculateHoursEquivalent(
        {
          class: ActivityClass.COMPLEMENTAR,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-02'),
          quantity: 0,
        },
        {
          cod: 'I1',
          unity: Unity.UNIDADE,
          maxHoursPerCertificateOrSemester: 34,
        },
      );
      expect(got).toBe(0);
    });

    it('class LIVRE bypasses per-type caps and returns the intermediate value', () => {
      const got = calculateHoursEquivalent(
        {
          class: ActivityClass.LIVRE,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-02'),
          quantity: 999,
        },
        { cod: 'L', unity: Unity.HORAS, maxHoursPerCertificateOrSemester: 51 },
      );
      expect(got).toBe(999);
    });

    it('semester unit with class LIVRE returns semesters × K (Excel quirk)', () => {
      const got = calculateHoursEquivalent(
        {
          class: ActivityClass.LIVRE,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          quantity: null,
        },
        {
          cod: 'C',
          unity: Unity.SEMESTRE,
          maxHoursPerCertificateOrSemester: 51,
        },
      );
      expect(got).toBeCloseTo(102, 2);
    });
  });

  describe('semestersBetween', () => {
    it('one full year (12 months) = 2 semesters', () => {
      expect(
        semestersBetween(new Date('2019-08-01'), new Date('2020-07-31')),
      ).toBeCloseTo(2, 5);
    });

    it('exactly 6 months = 1 semester', () => {
      expect(
        semestersBetween(new Date('2024-01-01'), new Date('2024-06-30')),
      ).toBeCloseTo(1, 5);
    });

    it('14 days = 0 semesters (under 15-day rounding threshold)', () => {
      const result = semestersBetween(
        new Date('2024-01-01'),
        new Date('2024-01-14'),
      );
      expect(result).toBe(0);
    });

    it('15 days = 1/6 semester (15-day rounding threshold reached)', () => {
      const result = semestersBetween(
        new Date('2024-01-01'),
        new Date('2024-01-15'),
      );
      expect(result).toBeCloseTo(1 / 6, 5);
    });

    it('returns 0 for inverted ranges', () => {
      expect(
        semestersBetween(new Date('2024-12-31'), new Date('2024-01-01')),
      ).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('returns 0 when quantity is null for non-semester types', () => {
      const got = calculateHoursEquivalent(
        {
          class: ActivityClass.COMPLEMENTAR,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-02'),
          quantity: null,
        },
        { cod: 'G', unity: Unity.HORAS, maxHoursPerCertificateOrSemester: 51 },
      );
      expect(got).toBe(0);
    });

    it('returns 0 for semester types when dates are missing', () => {
      const got = calculateHoursEquivalent(
        {
          class: ActivityClass.COMPLEMENTAR,
          startDate: null,
          endDate: null,
          quantity: null,
        },
        {
          cod: 'B',
          unity: Unity.SEMESTRE,
          maxHoursPerCertificateOrSemester: 51,
        },
      );
      expect(got).toBe(0);
    });
  });
});
