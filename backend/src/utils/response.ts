import type { Response } from 'express';
import type { ApiResponse } from '../types/api-response.js';
export function sendData<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ data } satisfies ApiResponse<T>);
}
export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): ApiResponse<T[]> {
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
