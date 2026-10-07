import { z } from 'zod';
import { empty } from '../../middleware/validate.js';
const email = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z
  .string()
  .min(8)
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72);
const credentials = z.object({ email, password: passwordSchema }).strict();
export const loginSchema = z.object({
  body: credentials,
  query: empty,
  params: empty,
});
export const registerSchema = z.object({
  body: credentials.extend({ fullName: z.string().trim().min(2).max(100) }),
  query: empty,
  params: empty,
});
export const emptyRequestSchema = z.object({
  body: empty,
  query: empty,
  params: empty,
});
export type LoginRequestDto = z.infer<typeof loginSchema>['body'];
export type RegisterRequestDto = z.infer<typeof registerSchema>['body'];
