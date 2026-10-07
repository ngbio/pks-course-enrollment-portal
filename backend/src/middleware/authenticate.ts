import type { RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { userSelect } from '../modules/auth/auth.mapper.js';
import type { UserResponseDto } from '../modules/auth/auth.dto.js';
import { positiveId } from './validate.js';
export const COOKIE_NAME = 'pks_session';
export const currentUser = (res: Response): UserResponseDto =>
  res.locals.user as UserResponseDto;
export function authenticate(db: PrismaClient, config: Config): RequestHandler {
  return async (req, res, next) => {
    const token: unknown = req.cookies?.[COOKIE_NAME];
    let id: number;
    try {
      if (typeof token !== 'string') throw new Error();
      const payload = jwt.verify(token, config.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'pks-api',
        audience: 'pks-portal',
      });
      if (
        typeof payload === 'string' ||
        typeof payload.sub !== 'string' ||
        !payload.exp
      )
        throw new Error();
      id = positiveId.parse(payload.sub);
    } catch {
      throw new AppError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
    }
    const user = await db.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user)
      throw new AppError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
    res.locals.user = user;
    next();
  };
}
