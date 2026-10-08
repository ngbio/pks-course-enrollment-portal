import { timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import type { RequestHandler } from 'express';
import type { Config } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export function edgeProxy(config: Config): RequestHandler {
  return (req, _res, next) => {
    if (
      !config.EDGE_PROXY_SECRET ||
      (req.method === 'GET' && req.path === '/api/health')
    ) {
      next();
      return;
    }
    const supplied = Buffer.from(req.get('x-pks-proxy-secret') ?? '');
    const expected = Buffer.from(config.EDGE_PROXY_SECRET);
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    ) {
      throw new AppError(
        403,
        'PROXY_REQUIRED',
        'Vui lòng truy cập qua website.',
      );
    }
    const clientIp = req.get('x-pks-client-ip') ?? '';
    if (!isIP(clientIp)) {
      throw new AppError(
        400,
        'INVALID_PROXY_IP',
        'Địa chỉ truy cập không hợp lệ.',
      );
    }
    // Trust exactly one sanitized hop, after authenticating our Worker. Ignore
    // Render's multi-hop XFF chain and any client-supplied forwarding headers.
    req.headers['x-forwarded-for'] = clientIp;
    delete req.headers.forwarded;
    delete req.headers['x-pks-proxy-secret'];
    next();
  };
}
