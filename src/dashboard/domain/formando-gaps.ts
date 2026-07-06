import { Category } from '@prisma/client';
import { ActivityProgress } from '../../activities/domain/progress-calculator.js';
import { CurriculumRules } from '../../activities/domain/curriculum-rules.js';

export interface CategoryGap {
  category: Category;
  achieved: number;
  required: number | null;
  gap: number;
}

export interface FormandoGaps {
  categoryGaps: CategoryGap[];
  complementaryGap: number;
  freeGap: number;
  totalGap: number;
  blockers: string[];
}

const CATEGORY_LABELS_PT: Record<Category, string> = {
  [Category.ENSINO]: 'Ensino',
  [Category.PESQUISA]: 'Pesquisa',
  [Category.EXTENSAO]: 'Extensão',
};

export function calculateFormandoGaps(
  progress: ActivityProgress,
  rules: CurriculumRules | null,
): FormandoGaps {
  const categoryGaps: CategoryGap[] = progress.categoryProgress.map((cp) => ({
    category: cp.category,
    achieved: cp.hoursAchieved,
    required: cp.minRequired,
    gap:
      cp.minRequired !== null
        ? round2(Math.max(cp.minRequired - cp.hoursAchieved, 0))
        : 0,
  }));

  const passingCount = progress.categoryProgress.filter(
    (cp) => cp.meetsMinimum,
  ).length;
  const minCategoriesRequired =
    rules !== null && rules.minHoursPerCategory !== null
      ? rules.minCategoriesRequired
      : null;
  const categoriesStillNeeded =
    minCategoriesRequired !== null
      ? Math.max(minCategoriesRequired - passingCount, 0)
      : 0;

  const pendingCategoryGaps = categoryGaps
    .filter((g) => g.gap > 0)
    .sort((a, b) => a.gap - b.gap);

  const categoryNeed = pendingCategoryGaps
    .slice(0, categoriesStillNeeded)
    .reduce((sum, g) => sum + g.gap, 0);

  const complementaryGap =
    progress.complementaryProgress.minRequired !== null
      ? Math.max(
          progress.complementaryProgress.minRequired -
            progress.complementaryProgress.totalCountedHours,
          0,
        )
      : 0;

  const freeGap = Math.max(
    progress.freeProgress.minRequired - progress.freeProgress.totalHours,
    0,
  );

  const complementaryNeed = Math.max(complementaryGap, categoryNeed);

  const maxAccepted = progress.complementaryProgress.maxAccepted;
  const carriedToFree =
    maxAccepted !== null && rules
      ? (Math.max(
          progress.complementaryProgress.totalRawHours +
            complementaryNeed -
            maxAccepted,
          0,
        ) -
          Math.max(
            progress.complementaryProgress.totalRawHours - maxAccepted,
            0,
          )) *
        rules.excessToFreeMultiplier
      : 0;

  const remainingFreeGap = Math.max(freeGap - carriedToFree, 0);
  const totalGap = round2(complementaryNeed + remainingFreeGap);

  const blockers = buildBlockers(
    categoriesStillNeeded,
    pendingCategoryGaps,
    complementaryGap,
    freeGap,
  );

  return {
    categoryGaps,
    complementaryGap: round2(complementaryGap),
    freeGap: round2(freeGap),
    totalGap,
    blockers,
  };
}

function buildBlockers(
  categoriesStillNeeded: number,
  pendingCategoryGaps: CategoryGap[],
  complementaryGap: number,
  freeGap: number,
): string[] {
  const messages: string[] = [];

  if (categoriesStillNeeded > 0) {
    const options = pendingCategoryGaps
      .map(
        (g) => `${CATEGORY_LABELS_PT[g.category]} (faltam ${round2(g.gap)}h)`,
      )
      .join(', ');
    const noun = categoriesStillNeeded > 1 ? 'categorias' : 'categoria';
    messages.push(
      `Falta atingir o mínimo em mais ${categoriesStillNeeded} ${noun}: ${options}`,
    );
  }

  if (complementaryGap > 0) {
    messages.push(
      `Faltam ${round2(complementaryGap)}h no total de Complementares`,
    );
  }

  if (freeGap > 0) {
    messages.push(`Faltam ${round2(freeGap)}h em Formação Livre`);
  }

  if (messages.length === 0) {
    messages.push('Atende todos os requisitos mínimos');
  }

  return messages;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
