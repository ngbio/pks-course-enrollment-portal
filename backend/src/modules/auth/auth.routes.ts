import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../config/env.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { authLimiters } from '../../middleware/rate-limit.js';
import { AuthService } from './auth.service.js';
import { authController } from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  emptyRequestSchema,
} from './auth.schema.js';
export function authRoutes(db: PrismaClient, config: Config) {
  const r = Router();
  const c = authController(new AuthService(db, config), config);
  const limits = authLimiters(config);
  r.post('/register', limits.registerIp, validate(registerSchema), c.register);
  r.post(
    '/login',
    limits.loginIp,
    validate(loginSchema),
    limits.loginAccount,
    c.login,
  );
  r.post('/logout', validate(emptyRequestSchema), c.logout);
  r.get('/me', authenticate(db, config), validate(emptyRequestSchema), c.me);
  return r;
}
