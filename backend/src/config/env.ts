import 'dotenv/config';
import { z } from 'zod';

const positive = (fallback: number) =>
  z.coerce.number().int().positive().default(fallback);
const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: positive(4000),
  DATABASE_URL: z.string().url().startsWith('mysql://'),
  JWT_SECRET: z
    .string()
    .min(32)
    .refine(
      (v) => !v.startsWith('replace-with-'),
      'Replace example JWT secret',
    ),
  JWT_TTL_SECONDS: positive(7200),
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:4000')
    .transform((v) => v.split(',').map((s) => s.trim()))
    .pipe(z.array(z.string().url()).min(1)),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  AUTH_WINDOW_MS: positive(900000),
  LOGIN_IP_LIMIT: positive(20),
  LOGIN_ACCOUNT_LIMIT: positive(5),
  REGISTER_IP_LIMIT: positive(5),
});
export type Config = z.infer<typeof schema>;
export function loadConfig(): Config {
  const result = schema.safeParse(process.env);
  if (!result.success)
    throw new Error(
      `Invalid environment fields: ${result.error.issues.map((i) => i.path.join('.')).join(', ')}`,
    );
  return result.data;
}
