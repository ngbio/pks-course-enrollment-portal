import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../config/env.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { emptyRequestSchema } from '../auth/auth.schema.js';
import {
  courseListSchema,
  courseIdSchema,
  courseCreateSchema,
  courseUpdateSchema,
} from './course.schema.js';
import { CourseService } from './course.service.js';
import { courseController } from './course.controller.js';
export function courseRoutes(db: PrismaClient, config: Config) {
  const r = Router();
  const service = new CourseService(db);
  const c = courseController(service);
  const a = courseController(service, true);
  r.get('/categories', validate(emptyRequestSchema), c.categories);
  r.get('/courses', validate(courseListSchema), c.list);
  r.get('/courses/:id', validate(courseIdSchema), c.detail);
  const admin = Router();
  admin.use(authenticate(db, config), authorize('ADMIN', 'STAFF'));
  admin.get('/', validate(courseListSchema), a.list);
  admin.get('/:id', validate(courseIdSchema), a.detail);
  admin.post('/', validate(courseCreateSchema), a.create);
  admin.patch('/:id', validate(courseUpdateSchema), a.update);
  admin.delete('/:id', validate(courseIdSchema), a.remove);
  r.use('/admin/courses', admin);
  return r;
}
