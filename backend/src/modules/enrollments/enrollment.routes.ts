import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../config/env.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  enrollSchema,
  myEnrollmentsSchema,
  courseEnrollmentsSchema,
} from './enrollment.schema.js';
import { EnrollmentService } from './enrollment.service.js';
import { enrollmentController } from './enrollment.controller.js';
export function enrollmentRoutes(db: PrismaClient, config: Config) {
  const r = Router();
  const c = enrollmentController(new EnrollmentService(db));
  const auth = authenticate(db, config);
  r.post(
    '/courses/:id/enrollments',
    auth,
    authorize('STUDENT'),
    validate(enrollSchema),
    c.enroll,
  );
  r.get(
    '/me/enrollments',
    auth,
    authorize('STUDENT'),
    validate(myEnrollmentsSchema),
    c.mine,
  );
  r.get(
    '/admin/courses/:id/enrollments',
    auth,
    authorize('ADMIN', 'STAFF'),
    validate(courseEnrollmentsSchema),
    c.forCourse,
  );
  return r;
}
