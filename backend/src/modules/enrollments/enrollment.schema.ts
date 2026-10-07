import { z } from 'zod';
import { empty, pagination, idParams } from '../../middleware/validate.js';
export const enrollSchema = z.object({
  params: idParams,
  body: empty,
  query: empty,
});
export const myEnrollmentsSchema = z.object({
  params: empty,
  body: empty,
  query: pagination,
});
export const courseEnrollmentsSchema = z.object({
  params: idParams,
  body: empty,
  query: pagination,
});
export type EnrollRequestDto = z.infer<typeof enrollSchema>;
export type EnrollmentListRequestDto = z.infer<typeof courseEnrollmentsSchema>;
