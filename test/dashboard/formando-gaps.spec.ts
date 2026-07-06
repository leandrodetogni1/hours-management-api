import {
  ActivityClass,
  Category,
  Course,
  CurriculumYear,
  Status,
} from '@prisma/client';
import {
  calculateActivityProgress,
  ProgressActivity,
} from '../../src/activities/domain/progress-calculator';
import { CurriculumRules } from '../../src/activities/domain/curriculum-rules';
import { calculateFormandoGaps } from '../../src/dashboard/domain/formando-gaps';

function makeRules(overrides: Partial<CurriculumRules> = {}): CurriculumRules {
  return {
    curriculumYear: CurriculumYear.Y2015,
    minHoursPerCategory: 120,
    minCategoriesRequired: 2,
    excessToFreeMultiplier: 1,
    minFreeHours: 217,
    courseRules: [
      {
        course: Course.ENGENHARIA_DA_COMPUTACAO,
        totalMin: 315,
        totalMax: 315,
      },
    ],
    ...overrides,
  };
}

let typeSeq = 0;
function approved(
  category: Category | null,
  hours: number,
  cls: ActivityClass = ActivityClass.COMPLEMENTAR,
): ProgressActivity {
  typeSeq += 1;
  return {
    status: Status.APPROVED,
    class: cls,
    hoursEquivalent: hours,
    activityType: category
      ? {
          id: `type-${typeSeq}`,
          cod: 'X',
          label: 'Tipo de teste',
          category,
          curriculumRules: [],
        }
      : null,
  };
}

function progressFor(
  activities: ProgressActivity[],
  rules: CurriculumRules | null,
) {
  return calculateActivityProgress({
    curriculumRules: rules,
    course: Course.ENGENHARIA_DA_COMPUTACAO,
    activities,
  });
}

describe('calculateFormandoGaps', () => {
  describe('regra de mínimo em N categorias', () => {
    test('conta apenas as categorias mais próximas necessárias para satisfazer a regra 2 de 3', () => {
      const rules = makeRules();
      const progress = progressFor(
        [approved(Category.ENSINO, 186), approved(Category.EXTENSAO, 10)],
        rules,
      );

      const result = calculateFormandoGaps(progress, rules);

      expect(result.categoryGaps).toEqual([
        { category: Category.ENSINO, achieved: 186, required: 120, gap: 0 },
        { category: Category.PESQUISA, achieved: 0, required: 120, gap: 120 },
        { category: Category.EXTENSAO, achieved: 10, required: 120, gap: 110 },
      ]);
      expect(result.complementaryGap).toBe(119);
      expect(result.freeGap).toBe(217);
      expect(result.totalGap).toBe(336);
    });

    test('exige todas as categorias quando minCategoriesRequired é 3', () => {
      const rules = makeRules({
        minCategoriesRequired: 3,
        courseRules: [
          {
            course: Course.ENGENHARIA_DA_COMPUTACAO,
            totalMin: 315,
            totalMax: 500,
          },
        ],
      });
      const progress = progressFor(
        [approved(Category.ENSINO, 186), approved(Category.EXTENSAO, 10)],
        rules,
      );

      const result = calculateFormandoGaps(progress, rules);

      expect(result.totalGap).toBe(447);
      expect(result.blockers).toContain(
        'Falta atingir o mínimo em mais 2 categorias: Extensão (faltam 110h), Pesquisa (faltam 120h)',
      );
    });

    test('não conta as mesmas horas em categoria e no total de complementares', () => {
      const rules = makeRules();
      const progress = progressFor(
        [approved(Category.ENSINO, 290), approved(Category.EXTENSAO, 10)],
        rules,
      );

      const result = calculateFormandoGaps(progress, rules);

      expect(result.complementaryGap).toBe(15);
      expect(result.totalGap).toBe(232);
    });

    test('horas complementares excedentes abatem o gap de Formação Livre', () => {
      const rules = makeRules();
      const progress = progressFor([approved(Category.ENSINO, 315)], rules);

      const result = calculateFormandoGaps(progress, rules);

      expect(result.complementaryGap).toBe(0);
      expect(result.freeGap).toBe(217);
      expect(result.totalGap).toBe(217);
    });

    test('ignora a regra de categorias quando minHoursPerCategory não está definido', () => {
      const rules = makeRules({ minHoursPerCategory: null });
      const progress = progressFor(
        [
          approved(Category.ENSINO, 315),
          approved(null, 217, ActivityClass.LIVRE),
        ],
        rules,
      );

      const result = calculateFormandoGaps(progress, rules);

      expect(result.totalGap).toBe(0);
      expect(result.blockers).toEqual(['Atende todos os requisitos mínimos']);
    });

    test('considera categorias e Formação Livre quando o curso não tem regra de total', () => {
      const rules = makeRules({ courseRules: [] });
      const progress = progressFor([approved(Category.ENSINO, 186)], rules);

      const result = calculateFormandoGaps(progress, rules);

      expect(result.complementaryGap).toBe(0);
      expect(result.totalGap).toBe(337);
    });

    test('não conta duas vezes o excedente que já migrou para Formação Livre', () => {
      const rules = makeRules();
      const progress = progressFor([approved(Category.ENSINO, 350)], rules);

      const result = calculateFormandoGaps(progress, rules);

      expect(result.freeGap).toBe(182);
      expect(result.totalGap).toBe(182);
    });

    test('totalGap é 0 quando todos os requisitos foram atingidos', () => {
      const rules = makeRules();
      const progress = progressFor(
        [
          approved(Category.ENSINO, 195),
          approved(Category.EXTENSAO, 120),
          approved(null, 217, ActivityClass.LIVRE),
        ],
        rules,
      );

      const result = calculateFormandoGaps(progress, rules);

      expect(result.totalGap).toBe(0);
      expect(result.blockers).toEqual(['Atende todos os requisitos mínimos']);
    });
  });

  describe('blockers', () => {
    test('aponta a regra de categorias com as opções em aberto ordenadas pelo menor gap', () => {
      const rules = makeRules();
      const progress = progressFor(
        [approved(Category.ENSINO, 186), approved(Category.EXTENSAO, 10)],
        rules,
      );

      const result = calculateFormandoGaps(progress, rules);

      expect(result.blockers).toEqual([
        'Falta atingir o mínimo em mais 1 categoria: Extensão (faltam 110h), Pesquisa (faltam 120h)',
        'Faltam 119h no total de Complementares',
        'Faltam 217h em Formação Livre',
      ]);
    });

    test('não aponta categorias quando a regra 2 de 3 já está satisfeita', () => {
      const rules = makeRules();
      const progress = progressFor(
        [approved(Category.ENSINO, 150), approved(Category.EXTENSAO, 130)],
        rules,
      );

      const result = calculateFormandoGaps(progress, rules);

      expect(result.blockers).toEqual([
        'Faltam 35h no total de Complementares',
        'Faltam 217h em Formação Livre',
      ]);
      expect(result.totalGap).toBe(252);
    });
  });

  describe('sem regras de currículo', () => {
    test('considera apenas o gap de Formação Livre', () => {
      const progress = progressFor([approved(Category.ENSINO, 50)], null);

      const result = calculateFormandoGaps(progress, null);

      expect(result.categoryGaps.every((g) => g.gap === 0)).toBe(true);
      expect(result.complementaryGap).toBe(0);
      expect(result.totalGap).toBe(217);
    });
  });
});
