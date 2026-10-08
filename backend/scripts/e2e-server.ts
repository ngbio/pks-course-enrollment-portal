import dotenv from 'dotenv';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { createDatabase } from '../src/lib/prisma.js';

dotenv.config({ path: '.env.test', override: true, quiet: true });
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) {
  throw new Error('E2E server requires a dedicated _test database');
}
const config = {
  ...loadConfig(),
  DATABASE_URL: url,
  PORT: 4010,
  LOGIN_IP_LIMIT: 500,
  LOGIN_ACCOUNT_LIMIT: 100,
  REGISTER_IP_LIMIT: 100,
  ALLOWED_ORIGINS: ['http://127.0.0.1:5174', 'http://localhost:5174'],
};
const db = createDatabase(url);
await db.$connect();
const server = createApp(db, config).listen(4010, '127.0.0.1');
const close = () =>
  server.close(() => void db.$disconnect().then(() => process.exit(0)));
process.on('SIGINT', close);
process.on('SIGTERM', close);
