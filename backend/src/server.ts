import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { createDatabase } from './lib/prisma.js';
const config = loadConfig();
const db = createDatabase(config.DATABASE_URL);
await db.$connect();
const server = createApp(db, config).listen(config.PORT, () =>
  console.log(`PKS API listening on port ${config.PORT}`),
);
server.requestTimeout = 30000;
server.headersTimeout = 15000;
let stopping = false;
const shutdown = () => {
  if (stopping) return;
  stopping = true;
  const timer = setTimeout(() => process.exit(1), 10000).unref();
  server.close(() => {
    void db.$disconnect().finally(() => {
      clearTimeout(timer);
      process.exit(0);
    });
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
