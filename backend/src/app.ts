import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type { PrismaClient } from '@prisma/client';
import type { Config } from './config/env.js';
import { AppError } from './utils/app-error.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { courseRoutes } from './modules/courses/course.routes.js';
import { enrollmentRoutes } from './modules/enrollments/enrollment.routes.js';
import { edgeProxy } from './middleware/edge-proxy.js';

export function createApp(db: PrismaClient, config: Config) {
  const app = express();
  app.disable('x-powered-by');
  app.set('query parser', 'simple');
  app.set('trust proxy', config.TRUST_PROXY_HOPS);
  app.use(helmet());
  app.use(edgeProxy(config));
  app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }));
  app.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use((req, _res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      // Non-browser clients may omit Origin; browsers with missing Origin must not be cross-site.
      if (
        (origin && !config.ALLOWED_ORIGINS.includes(origin)) ||
        (!origin && req.get('sec-fetch-site') === 'cross-site')
      )
        throw new AppError(
          403,
          'ORIGIN_NOT_ALLOWED',
          'Nguồn yêu cầu không được phép.',
        );
      const hasBody =
        Number(req.get('content-length') ?? 0) > 0 ||
        Boolean(req.get('transfer-encoding'));
      if (hasBody && !req.is('application/json'))
        throw new AppError(
          415,
          'UNSUPPORTED_MEDIA_TYPE',
          'Chỉ hỗ trợ application/json.',
        );
    }
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  app.get('/api/health', async (_req, res) => {
    try {
      await db.$queryRaw`SELECT 1`;
      res.json({ data: { status: 'ok' } });
    } catch {
      throw new AppError(
        503,
        'DATABASE_UNAVAILABLE',
        'Database chưa sẵn sàng.',
      );
    }
  });
  app.use('/api/auth', authRoutes(db, config));
  app.use('/api', enrollmentRoutes(db, config));
  app.use('/api', courseRoutes(db, config));
  app.use((_req, _res, next) =>
    next(new AppError(404, 'NOT_FOUND', 'Không tìm thấy endpoint.')),
  );
  app.use(errorHandler);
  return app;
}
