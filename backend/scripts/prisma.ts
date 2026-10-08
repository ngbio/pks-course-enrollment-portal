import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { databaseUrl } from '../src/config/database.js';

// Prisma CLI still requires DATABASE_URL; construct it from DB_* when needed.
const result = spawnSync(
  process.execPath,
  ['node_modules/prisma/build/index.js', ...process.argv.slice(2)],
  { stdio: 'inherit', env: { ...process.env, DATABASE_URL: databaseUrl() } },
);
if (result.error) throw new Error('Could not start Prisma CLI');
process.exitCode = result.status ?? 1;
