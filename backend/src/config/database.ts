import { z } from 'zod';

const positiveInt = (fallback: number, max = 2147483647) =>
  z.coerce.number().int().min(1).max(max).default(fallback);
const fields = z.object({
  DB_HOST: z
    .string()
    .trim()
    .regex(/^(?:[a-zA-Z0-9._-]+|\[[0-9a-fA-F:]+\])$/),
  DB_PORT: positiveInt(3306, 65535),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/),
  DB_SSL_CA: z.string().min(1).optional(),
  DB_CONNECTION_LIMIT: positiveInt(5),
  DB_CONNECT_TIMEOUT: positiveInt(15),
  DB_POOL_TIMEOUT: positiveInt(15),
});

export function databaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  // Explicit URLs take precedence so isolated test URLs never use local DB_*.
  if (env.DATABASE_URL) {
    const url = new URL(env.DATABASE_URL);
    // Aiven's REQUIRED mode encrypts traffic without requiring a local CA file.
    if (url.searchParams.get('ssl-mode')?.toUpperCase() === 'REQUIRED') {
      url.searchParams.delete('ssl-mode');
      if (!url.searchParams.has('sslaccept')) {
        url.searchParams.set('sslaccept', 'accept_invalid_certs');
      }
      return url.toString();
    }
    return env.DATABASE_URL;
  }
  const result = fields.safeParse(env);
  if (!result.success) {
    throw new Error(
      `Invalid database fields: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
    );
  }
  const db = result.data;
  const url = new URL(`mysql://${db.DB_HOST}:${db.DB_PORT}/${db.DB_NAME}`);
  url.username = encodeURIComponent(db.DB_USER);
  url.password = encodeURIComponent(db.DB_PASSWORD);
  url.searchParams.set('connection_limit', String(db.DB_CONNECTION_LIMIT));
  url.searchParams.set('connect_timeout', String(db.DB_CONNECT_TIMEOUT));
  url.searchParams.set('pool_timeout', String(db.DB_POOL_TIMEOUT));
  if (db.DB_SSL_CA) {
    url.searchParams.set('sslcert', db.DB_SSL_CA);
    url.searchParams.set('sslaccept', 'strict');
  }
  return url.toString();
}
