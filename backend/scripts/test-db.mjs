import dotenv from 'dotenv';
import { spawnSync } from 'node:child_process';
dotenv.config({ path: '.env.test', quiet: true });
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test'))
  throw new Error(
    'Use a dedicated TEST_DATABASE_URL with database name ending in _test',
  );
const command =
  process.argv[2] === 'seed'
    ? ['--import', 'tsx', 'prisma/seed.ts']
    : ['node_modules/prisma/build/index.js', 'migrate', 'deploy'];
const result = spawnSync(process.execPath, command, {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url },
});
process.exitCode = result.status ?? 1;
