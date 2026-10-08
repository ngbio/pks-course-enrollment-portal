import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { accessSync } from 'node:fs';

// Fail before migrations if the production configuration is incomplete.
const { loadConfig } = await import('../dist/config/env.js');
const config = loadConfig();
process.env.DATABASE_URL = config.DATABASE_URL;
if (config.NODE_ENV !== 'production' || !config.EDGE_PROXY_SECRET) {
  throw new Error('Render requires production mode and EDGE_PROXY_SECRET');
}
const database = new URL(config.DATABASE_URL);
const certificate = database.searchParams.get('sslcert');
if (certificate) accessSync(certificate);

// Free Render services do not have a pre-deploy command. Run deploy (never reset)
// at startup for this single-instance demo, using a fresh database for the baseline.
const migration = spawnSync(
  process.execPath,
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  { stdio: 'inherit', env: process.env },
);
if (migration.error || migration.status !== 0) {
  throw new Error('Migration failed; API startup cancelled');
}
await import('../dist/server.js');
