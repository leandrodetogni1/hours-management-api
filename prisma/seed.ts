import 'dotenv/config';
import { Category, CurriculumYear, PrismaClient, Unity } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed activity_types
  const activityTypes = [
    {
      cod: 'A',
      label: 'Monitorias',
      category: Category.ENSINO,
      unity: Unity.SEMESTRE,
      maxHoursInComplementarActivities: 102,
      maxHoursPerCertificateOrSemester: 51,
    },
    {
      cod: 'B',
      label: 'Bolsista / Voluntário em Proj de Pesquisa',
      category: Category.PESQUISA,
      unity: Unity.SEMESTRE,
      maxHoursInComplementarActivities: 153,
      maxHoursPerCertificateOrSemester: 51,
    },
    {
      cod: 'C',
      label: 'Bolsista / Voluntário em Proj de Extensão',
      category: Category.EXTENSAO,
      unity: Unity.SEMESTRE,
      maxHoursInComplementarActivities: 153,
      maxHoursPerCertificateOrSemester: 51,
    },
    {
      cod: 'D',
      label: 'Bolsista / Voluntário em Proj de Ensino',
      category: Category.ENSINO,
      unity: Unity.SEMESTRE,
      maxHoursInComplementarActivities: 153,
      maxHoursPerCertificateOrSemester: 51,
    },
    {
      cod: 'E',
      label: 'Participação em Ativ. Extensão',
      category: Category.EXTENSAO,
      unity: Unity.HORAS,
      maxHoursInComplementarActivities: 153,
      maxHoursPerCertificateOrSemester: 34,
    },
    {
      cod: 'F',
      label: 'Participação na Semana Acadêmica do Curso',
      category: Category.ENSINO,
      unity: Unity.HORAS,
      maxHoursInComplementarActivities: 68,
      maxHoursPerCertificateOrSemester: 34,
    },
    {
      cod: 'G',
      label: 'Participação em Cursos e Escolas',
      category: Category.ENSINO,
      unity: Unity.HORAS,
      maxHoursInComplementarActivities: 102,
      maxHoursPerCertificateOrSemester: 51,
    },
    {
      cod: 'H1',
      label: 'Participação em Eventos Científicos Regionais e Locais',
      category: Category.PESQUISA,
      unity: Unity.UNIDADE,
      maxHoursInComplementarActivities: 51,
      maxHoursPerCertificateOrSemester: 17,
    },
    {
      cod: 'H2',
      label: 'Participação em Eventos Científicos Nacionais',
      category: Category.PESQUISA,
      unity: Unity.UNIDADE,
      maxHoursInComplementarActivities: 68,
      maxHoursPerCertificateOrSemester: 34,
    },
    {
      cod: 'H3',
      label: 'Participação em Eventos Científicos Internacionais',
      category: Category.PESQUISA,
      unity: Unity.UNIDADE,
      maxHoursInComplementarActivities: 68,
      maxHoursPerCertificateOrSemester: 34,
    },
    {
      cod: 'I1',
      label: 'Publicação em Eventos Científicos Regionais e Locais',
      category: Category.PESQUISA,
      unity: Unity.UNIDADE,
      maxHoursInComplementarActivities: 68,
      maxHoursPerCertificateOrSemester: 34,
    },
    {
      cod: 'I2',
      label: 'Publicação em Eventos Científicos Nacionais',
      category: Category.PESQUISA,
      unity: Unity.UNIDADE,
      maxHoursInComplementarActivities: 102,
      maxHoursPerCertificateOrSemester: 51,
    },
    {
      cod: 'I3',
      label: 'Publicação em Eventos Científicos Internacionais',
      category: Category.PESQUISA,
      unity: Unity.UNIDADE,
      maxHoursInComplementarActivities: 136,
      maxHoursPerCertificateOrSemester: 68,
    },
    {
      cod: 'J',
      label: 'Representação Estudantil',
      category: Category.ENSINO,
      unity: Unity.SEMESTRE,
      maxHoursInComplementarActivities: 102,
      maxHoursPerCertificateOrSemester: 51,
    },
    {
      cod: 'K',
      label: 'Obtenção de Prêmios e Distinções',
      category: Category.PESQUISA,
      unity: Unity.UNIDADE,
      maxHoursInComplementarActivities: 136,
      maxHoursPerCertificateOrSemester: 68,
    },
    {
      cod: 'L',
      label: 'Certificações Profissionais',
      category: Category.ENSINO,
      unity: Unity.HORAS,
      maxHoursInComplementarActivities: 102,
      maxHoursPerCertificateOrSemester: 51,
    },
  ];

  for (const at of activityTypes) {
    await prisma.activity_types.upsert({
      where: { cod: at.cod },
      update: {
        label: at.label,
        category: at.category,
        unity: at.unity,
        maxHoursInComplementarActivities: at.maxHoursInComplementarActivities,
        maxHoursPerCertificateOrSemester: at.maxHoursPerCertificateOrSemester,
      },
      create: at,
    });
  }

  const curriculumRules: Array<{
    cod: string;
    year: CurriculumYear;
    maxHoursTotal: number;
  }> = [
    { cod: 'C', year: CurriculumYear.Y2015, maxHoursTotal: 153 },
    { cod: 'D', year: CurriculumYear.Y2015, maxHoursTotal: 153 },
  ];

  for (const rule of curriculumRules) {
    const type = await prisma.activity_types.findUnique({
      where: { cod: rule.cod },
      select: { id: true },
    });
    if (!type) continue;
    await prisma.activity_type_curriculum_rules.upsert({
      where: {
        activityTypeId_curriculumYear: {
          activityTypeId: type.id,
          curriculumYear: rule.year,
        },
      },
      update: { maxHoursTotal: rule.maxHoursTotal },
      create: {
        activityTypeId: type.id,
        curriculumYear: rule.year,
        maxHoursTotal: rule.maxHoursTotal,
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
