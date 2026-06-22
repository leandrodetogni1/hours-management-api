import 'dotenv/config';
import {
  Course,
  CurriculumYear,
  PrismaClient,
  UserSituation,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const roleNames = ['owner', 'admin', 'reviewer', 'member'] as const;

const firstNames = [
  'Ana', 'Bruno', 'Camila', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela',
  'Henrique', 'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nathan',
  'Otávio', 'Paula', 'Rafael', 'Sofia', 'Thiago', 'Valentina', 'William',
  'Yasmin', 'André', 'Beatriz', 'Carlos', 'Débora', 'Enzo', 'Fernanda',
  'Gustavo', 'Helena',
];

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues',
  'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Fernandes', 'Carvalho',
  'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Alves', 'Monteiro', 'Cardoso',
  'Teixeira', 'Correia', 'Dias', 'Barbosa', 'Pinto', 'Moreira', 'Cunha',
  'Freitas', 'Machado', 'Vieira',
];

const situations: UserSituation[] = [
  UserSituation.REGULAR,
  UserSituation.FORMANDO,
  UserSituation.FORMADO,
];

const courses: Course[] = [
  Course.CIENCIA_DA_COMPUTACAO,
  Course.ENGENHARIA_DA_COMPUTACAO,
];

const slug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const roleForIndex = (i: number): (typeof roleNames)[number] => {
  if (i === 0) return 'owner';
  if (i % 10 === 0) return 'admin';
  if (i % 7 === 0) return 'reviewer';
  return 'member';
};

async function main() {
  const count = Number(process.argv[2]) || 50;

  const roleRows = await Promise.all(
    roleNames.map((name) =>
      prisma.roles.upsert({
        where: { name },
        update: {},
        create: { name },
        select: { id: true, name: true },
      }),
    ),
  );
  const roleIdByName = new Map(roleRows.map((r) => [r.name, r.id]));

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const data = Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 7) % lastNames.length];
    const roleName = roleForIndex(i);
    const hasCourse = i % 5 !== 0;
    const course = hasCourse ? courses[i % courses.length] : null;

    return {
      firstName,
      lastName,
      email: `${slug(firstName)}.${slug(lastName)}${i}@inf.ufpel.edu.br`,
      matricula: i % 8 === 0 ? null : `${2018 + (i % 7)}${String(1000 + i).padStart(6, '0')}`,
      roleId: roleIdByName.get(roleName)!,
      situation: situations[i % situations.length],
      course,
      curriculumYear: hasCourse
        ? i % 4 === 0
          ? CurriculumYear.Y2026
          : CurriculumYear.Y2015
        : null,
      createdAt: new Date(now - i * dayMs),
      updatedAt: new Date(now - i * dayMs),
    };
  });

  const result = await prisma.users.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(
    `Users seed completed: ${result.count} created (${count} requested, duplicates skipped)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
