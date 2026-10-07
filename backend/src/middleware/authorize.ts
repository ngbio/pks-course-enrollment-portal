import type { RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { currentUser } from './authenticate.js';
import { AppError } from '../utils/app-error.js';
export function authorize(...roles: Role[]): RequestHandler {
  return (_req, res, next) => {
    const user = currentUser(res);
    if (!user)
      throw new AppError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
    if (!roles.includes(user.role))
      throw new AppError(
        403,
        'FORBIDDEN',
        'Bạn không có quyền thực hiện thao tác này.',
      );
    next();
  };
}
