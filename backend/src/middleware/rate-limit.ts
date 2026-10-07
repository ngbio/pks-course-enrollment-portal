import { createHash } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import type { Config } from '../config/env.js';
const message = {
  error: {
    code: 'RATE_LIMITED',
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
    details: [],
  },
};
export function authLimiters(config: Config) {
  const common = {
    windowMs: config.AUTH_WINDOW_MS,
    standardHeaders: 'draft-8' as const,
    legacyHeaders: false,
    message,
  };
  return {
    loginIp: rateLimit({ ...common, limit: config.LOGIN_IP_LIMIT }),
    registerIp: rateLimit({ ...common, limit: config.REGISTER_IP_LIMIT }),
    loginAccount: rateLimit({
      ...common,
      limit: config.LOGIN_ACCOUNT_LIMIT,
      skipSuccessfulRequests: true,
      keyGenerator: (_req, res) =>
        createHash('sha256')
          .update(res.locals.validated.body.email)
          .digest('hex'),
    }),
  };
}
