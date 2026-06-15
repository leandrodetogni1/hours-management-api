import 'dotenv/config';
import {
  Category,
  Course,
  CurriculumYear,
  PrismaClient,
  Unity,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ActivityTypeSeed {
  cod: string;
  label: string;
  category: Category;
  unity: Unity;
}

interface ActivityTypeRuleSeed {
  cod: string;
  curriculumYear: CurriculumYear;
  maxHoursTotal: number;
  maxHoursPerCertificateOrSemester: number;
}

interface CurriculumSeed {
  year: CurriculumYear;
  minHoursPerCategory: number | null;
  minCategoriesRequired: number | null;
  excessToFreeMultiplier: number;
  minFreeHours: number;
}

interface CourseRuleSeed {
  curriculumYear: CurriculumYear;
  course: Course;
  totalMin: number;
  totalMax: number;
}

const roleNames: string[] = ['owner', 'admin', 'reviewer', 'member'];

const activityTypes: ActivityTypeSeed[] = [
  {
    cod: 'A',
    label: 'Monitorias',
    category: Category.ENSINO,
    unity: Unity.SEMESTRE,
  },
  {
    cod: 'B',
    label: 'Bolsista / Voluntário em Proj de Pesquisa',
    category: Category.PESQUISA,
    unity: Unity.SEMESTRE,
  },
  {
    cod: 'C',
    label: 'Bolsista / Voluntário em Proj de Extensão',
    category: Category.EXTENSAO,
    unity: Unity.SEMESTRE,
  },
  {
    cod: 'D',
    label: 'Bolsista / Voluntário em Proj de Ensino',
    category: Category.ENSINO,
    unity: Unity.SEMESTRE,
  },
  {
    cod: 'E',
    label: 'Participação em Ativ. Extensão',
    category: Category.EXTENSAO,
    unity: Unity.HORAS,
  },
  {
    cod: 'F',
    label: 'Participação na Semana Acadêmica do Curso',
    category: Category.ENSINO,
    unity: Unity.HORAS,
  },
  {
    cod: 'G',
    label: 'Participação em Cursos e Escolas',
    category: Category.ENSINO,
    unity: Unity.HORAS,
  },
  {
    cod: 'H1',
    label: 'Participação em Eventos Científicos Regionais e Locais',
    category: Category.PESQUISA,
    unity: Unity.UNIDADE,
  },
  {
    cod: 'H2',
    label: 'Participação em Eventos Científicos Nacionais',
    category: Category.PESQUISA,
    unity: Unity.UNIDADE,
  },
  {
    cod: 'H3',
    label: 'Participação em Eventos Científicos Internacionais',
    category: Category.PESQUISA,
    unity: Unity.UNIDADE,
  },
  {
    cod: 'I1',
    label: 'Publicação em Eventos Científicos Regionais e Locais',
    category: Category.PESQUISA,
    unity: Unity.UNIDADE,
  },
  {
    cod: 'I2',
    label: 'Publicação em Eventos Científicos Nacionais',
    category: Category.PESQUISA,
    unity: Unity.UNIDADE,
  },
  {
    cod: 'I3',
    label: 'Publicação em Eventos Científicos Internacionais',
    category: Category.PESQUISA,
    unity: Unity.UNIDADE,
  },
  {
    cod: 'J',
    label: 'Representação Estudantil',
    category: Category.ENSINO,
    unity: Unity.SEMESTRE,
  },
  {
    cod: 'K',
    label: 'Obtenção de Prêmios e Distinções',
    category: Category.PESQUISA,
    unity: Unity.UNIDADE,
  },
  {
    cod: 'L',
    label: 'Certificações Profissionais',
    category: Category.ENSINO,
    unity: Unity.HORAS,
  },
];

const curricula: CurriculumSeed[] = [
  {
    year: CurriculumYear.Y2015,
    minHoursPerCategory: 120,
    minCategoriesRequired: 2,
    excessToFreeMultiplier: 1,
    minFreeHours: 217,
  },
];

const courseRules: CourseRuleSeed[] = [
  {
    curriculumYear: CurriculumYear.Y2015,
    course: Course.ENGENHARIA_DA_COMPUTACAO,
    totalMin: 315,
    totalMax: 315,
  },
  {
    curriculumYear: CurriculumYear.Y2015,
    course: Course.CIENCIA_DA_COMPUTACAO,
    totalMin: 320,
    totalMax: 320,
  },
];

const Y2015_TYPE_RULES: Record<
  string,
  { maxHoursTotal: number; maxHoursPerCertificateOrSemester: number }
> = {
  A: { maxHoursTotal: 102, maxHoursPerCertificateOrSemester: 51 },
  B: { maxHoursTotal: 153, maxHoursPerCertificateOrSemester: 51 },
  C: { maxHoursTotal: 153, maxHoursPerCertificateOrSemester: 51 },
  D: { maxHoursTotal: 153, maxHoursPerCertificateOrSemester: 51 },
  E: { maxHoursTotal: 153, maxHoursPerCertificateOrSemester: 34 },
  F: { maxHoursTotal: 68, maxHoursPerCertificateOrSemester: 34 },
  G: { maxHoursTotal: 102, maxHoursPerCertificateOrSemester: 51 },
  H1: { maxHoursTotal: 51, maxHoursPerCertificateOrSemester: 17 },
  H2: { maxHoursTotal: 68, maxHoursPerCertificateOrSemester: 34 },
  H3: { maxHoursTotal: 68, maxHoursPerCertificateOrSemester: 34 },
  I1: { maxHoursTotal: 68, maxHoursPerCertificateOrSemester: 34 },
  I2: { maxHoursTotal: 102, maxHoursPerCertificateOrSemester: 51 },
  I3: { maxHoursTotal: 136, maxHoursPerCertificateOrSemester: 68 },
  J: { maxHoursTotal: 102, maxHoursPerCertificateOrSemester: 51 },
  K: { maxHoursTotal: 136, maxHoursPerCertificateOrSemester: 68 },
  L: { maxHoursTotal: 102, maxHoursPerCertificateOrSemester: 51 },
};

const activityTypeRules: ActivityTypeRuleSeed[] = activityTypes.map((at) => ({
  cod: at.cod,
  curriculumYear: CurriculumYear.Y2015,
  maxHoursTotal: Y2015_TYPE_RULES[at.cod].maxHoursTotal,
  maxHoursPerCertificateOrSemester:
    Y2015_TYPE_RULES[at.cod].maxHoursPerCertificateOrSemester,
}));

async function main() {
  for (const name of roleNames) {
    await prisma.roles.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const at of activityTypes) {
    await prisma.activity_types.upsert({
      where: { cod: at.cod },
      update: {
        label: at.label,
        category: at.category,
        unity: at.unity,
      },
      create: at,
    });
  }

  for (const c of curricula) {
    await prisma.curricula.upsert({
      where: { year: c.year },
      update: {
        minHoursPerCategory: c.minHoursPerCategory,
        minCategoriesRequired: c.minCategoriesRequired,
        excessToFreeMultiplier: c.excessToFreeMultiplier,
        minFreeHours: c.minFreeHours,
      },
      create: c,
    });
  }

  for (const cr of courseRules) {
    await prisma.curriculum_course_rules.upsert({
      where: {
        curriculumYear_course: {
          curriculumYear: cr.curriculumYear,
          course: cr.course,
        },
      },
      update: { totalMin: cr.totalMin, totalMax: cr.totalMax },
      create: cr,
    });
  }

  for (const rule of activityTypeRules) {
    const type = await prisma.activity_types.findUnique({
      where: { cod: rule.cod },
      select: { id: true },
    });
    if (!type) continue;
    await prisma.activity_type_curriculum_rules.upsert({
      where: {
        activityTypeId_curriculumYear: {
          activityTypeId: type.id,
          curriculumYear: rule.curriculumYear,
        },
      },
      update: {
        maxHoursTotal: rule.maxHoursTotal,
        maxHoursPerCertificateOrSemester: rule.maxHoursPerCertificateOrSemester,
      },
      create: {
        activityTypeId: type.id,
        curriculumYear: rule.curriculumYear,
        maxHoursTotal: rule.maxHoursTotal,
        maxHoursPerCertificateOrSemester: rule.maxHoursPerCertificateOrSemester,
      },
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
