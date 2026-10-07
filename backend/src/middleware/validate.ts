import type { RequestHandler, Response } from 'express';
import { z } from 'zod';
export function validate<S extends z.ZodTypeAny>(schema: S): RequestHandler {
  return (req, res, next) => {
    res.locals.validated = schema.parse({
      body: req.body ?? {},
      params: req.params,
      query: req.query,
    });
    next();
  };
}
export const validated = <T>(res: Response): T => res.locals.validated as T;
export const empty = z.object({}).strict();
export const positiveId = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(2147483647));
export const idParams = z.object({ id: positiveId }).strict();
const queryNumber = (fallback: string, max: number) =>
  z
    .string()
    .regex(/^\d+$/)
    .default(fallback)
    .transform(Number)
    .pipe(z.number().int().min(1).max(max));
export const pagination = z
  .object({ page: queryNumber('1', 1000000), limit: queryNumber('12', 100) })
  .strict();
export type Pagination = z.infer<typeof pagination>;
