import { PrismaClient } from '@prisma/client';
export const createDatabase = (url: string) =>
  new PrismaClient({ datasources: { db: { url } } });
