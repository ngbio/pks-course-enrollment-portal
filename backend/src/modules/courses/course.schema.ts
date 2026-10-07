import { z } from 'zod';
import { empty, pagination, idParams } from '../../middleware/validate.js';
const text = (max: number) => z.string().trim().min(1).max(max);
const fields = z
  .object({
    title: text(200),
    category: text(100),
    instructor: text(100),
    shortDescription: text(300),
    description: text(5000),
    tuitionVnd: z.number().int().min(0).max(2147483647),
    capacity: z.number().int().min(1).max(2147483647),
    isPublished: z.boolean(),
  })
  .strict();
export const courseQuery = pagination.extend({
  search: z.string().trim().max(100).optional(),
  category: text(100).optional(),
});
export const courseListSchema = z.object({
  body: empty,
  params: empty,
  query: courseQuery,
});
export const courseIdSchema = z.object({
  body: empty,
  params: idParams,
  query: empty,
});
export const courseCreateSchema = z.object({
  body: fields.extend({ isPublished: z.boolean().default(true) }),
  params: empty,
  query: empty,
});
export const courseUpdateSchema = z.object({
  body: fields.partial().refine((v) => Object.keys(v).length > 0),
  params: idParams,
  query: empty,
});
export type CourseQuery = z.infer<typeof courseQuery>;
export type CreateCourseRequestDto = z.infer<typeof courseCreateSchema>['body'];
export type UpdateCourseRequestDto = z.infer<typeof courseUpdateSchema>['body'];
