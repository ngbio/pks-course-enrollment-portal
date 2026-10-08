import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { passwordSchema } from '../src/modules/auth/auth.schema.js';
import { databaseUrl } from '../src/config/database.js';
const db = new PrismaClient({
  datasources: { db: { url: databaseUrl() } },
});
async function seed() {
  const password = passwordSchema.parse(process.env.SEED_DEMO_PASSWORD);
  if (password === 'Choose-a-local-demo-password')
    throw new Error('Set your own SEED_DEMO_PASSWORD');
  const passwordHash = await bcrypt.hash(password, 12);
  for (const [role, email, fullName] of [
    ['ADMIN', 'admin@pks.test', 'PKS Admin'],
    ['STAFF', 'staff@pks.test', 'PKS Staff'],
    ['STUDENT', 'student@pks.test', 'PKS Student'],
  ] as const) {
    await db.user.upsert({
      where: { email },
      update: {},
      create: { email, fullName, role, passwordHash },
    });
  }
  for (const [title, category] of [
    ['React thực chiến', 'Co-op IT'],
    ['Node.js và REST API', 'Co-op IT'],
    ['MOS Excel', 'MOS'],
  ] as const) {
    // Existing demo courses keep their IDs; new courses get AUTO_INCREMENT IDs.
    const existing = await db.course.findFirst({ where: { title, category } });
    if (existing) continue;
    await db.course.create({
      data: {
        title,
        category,
        instructor: 'Giảng viên PKS',
        shortDescription: `Khóa học ${title}`,
        description: 'Học thông qua bài tập thực hành và dự án cuối khóa.',
        tuitionVnd: 1500000,
        capacity: 20,
      },
    });
  }
  console.log(
    'Seed complete: admin@pks.test, staff@pks.test, student@pks.test. Existing records preserved.',
  );
}
try {
  await seed();
} finally {
  await db.$disconnect();
}
