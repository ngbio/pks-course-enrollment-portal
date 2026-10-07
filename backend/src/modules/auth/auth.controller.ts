import type { Request, Response, CookieOptions } from 'express';
import type { Config } from '../../config/env.js';
import { currentUser, COOKIE_NAME } from '../../middleware/authenticate.js';
import { validated } from '../../middleware/validate.js';
import { sendData } from '../../utils/response.js';
import { toUserResponse } from './auth.mapper.js';
import type { LoginRequestDto, RegisterRequestDto } from './auth.schema.js';
import type { AuthService } from './auth.service.js';
export function authController(service: AuthService, config: Config) {
  const cookie: CookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
  };
  return {
    register: async (_req: Request, res: Response) =>
      sendData(
        res,
        await service.register(
          validated<{ body: RegisterRequestDto }>(res).body,
        ),
        201,
      ),
    login: async (_req: Request, res: Response) => {
      const result = await service.login(
        validated<{ body: LoginRequestDto }>(res).body,
      );
      res.cookie(COOKIE_NAME, result.token, {
        ...cookie,
        maxAge: config.JWT_TTL_SECONDS * 1000,
      });
      return sendData(res, result.user);
    },
    logout: (_req: Request, res: Response) => {
      res.clearCookie(COOKIE_NAME, cookie);
      res.status(204).end();
    },
    me: (_req: Request, res: Response) =>
      sendData(res, toUserResponse(currentUser(res))),
  };
}
