import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Role, Prisma } from '@prisma/client';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { createApp } from '../../src/app.js';
import { loadConfig } from '../../src/config/env.js';
import { createDatabase } from '../../src/lib/prisma.js';
import { saveEvidence } from './test-evidence.js';

export const config = {
  ...loadConfig(),
  LOGIN_IP_LIMIT: 200,
  REGISTER_IP_LIMIT: 100,
  LOGIN_ACCOUNT_LIMIT: 100,
};
export const db = createDatabase(config.DATABASE_URL);
export const app = createApp(db, config);
export const password = 'Integration-password-123';
let hash: string;
export let adminCookie: string;
export let studentCookie: string;
export let studentId: number;

export function cookieFor(id: number, expiresIn = 3600) {
  const token = jwt.sign({}, config.JWT_SECRET, {
    subject: String(id),
    algorithm: 'HS256',
    issuer: 'pks-api',
    audience: 'pks-portal',
    expiresIn,
  });
  return `pks_session=${token}`;
}

export const courseBody = (
  overrides: Partial<Prisma.CourseCreateInput> = {},
) => ({
  title: 'React thực chiến',
  category: 'Co-op IT',
  instructor: 'PKS Teacher',
  shortDescription: 'Short course description',
  description: 'Full course description',
  tuitionVnd: 1500000,
  capacity: 2,
  isPublished: true,
  ...overrides,
});

export const makeCourse = (overrides: Partial<Prisma.CourseCreateInput> = {}) =>
  db.course.create({ data: courseBody(overrides) });

export async function createUser(role: Role = 'STUDENT') {
  return db.user.create({
    data: {
      email: `${randomUUID()}@test.com`,
      fullName: `Test ${role}`,
      passwordHash: hash,
      role,
    },
  });
}

// Register explicitly once per test file. Files run sequentially against one DB.
export function setupIntegrationTests() {
  let databaseVersion: string | undefined;
  beforeAll(async () => {
    if (!new URL(config.DATABASE_URL).pathname.endsWith('_test')) {
      throw new Error('Refusing non-test database');
    }
    await db.$connect();
    hash = await bcrypt.hash(password, 12);
    const version = await db.$queryRaw<
      { version: string }[]
    >`SELECT VERSION() AS version`;
    databaseVersion = version[0]?.version;
  });

  beforeEach(async () => {
    await db.enrollment.deleteMany();
    await db.course.deleteMany();
    await db.user.deleteMany();
    const admin = await createUser('ADMIN');
    const student = await createUser();
    adminCookie = cookieFor(admin.id);
    studentCookie = cookieFor(student.id);
    studentId = student.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    if (databaseVersion) saveEvidence(databaseVersion);
  });
}
