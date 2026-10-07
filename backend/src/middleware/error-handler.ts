import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error.js';
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  let e = new AppError(500, 'INTERNAL_ERROR', 'Đã xảy ra lỗi hệ thống.');
  if (error instanceof AppError) e = error;
  else if (error instanceof ZodError)
    e = new AppError(
      400,
      'VALIDATION_ERROR',
      'Dữ liệu không hợp lệ.',
      error.issues.map((i) => ({
        field: i.path.join('.'),
        message:
          i.code === 'unrecognized_keys'
            ? 'Có trường không được phép.'
            : 'Giá trị không hợp lệ hoặc vượt giới hạn.',
      })),
    );
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002')
      e = new AppError(409, 'DUPLICATE_RESOURCE', 'Dữ liệu đã tồn tại.');
    else if (error.code === 'P2003')
      e = new AppError(409, 'RESOURCE_IN_USE', 'Dữ liệu đang được sử dụng.');
    else if (error.code === 'P2025')
      e = new AppError(404, 'NOT_FOUND', 'Không tìm thấy dữ liệu.');
  } else if (error && typeof error === 'object' && 'type' in error) {
    if (error.type === 'entity.too.large')
      e = new AppError(413, 'PAYLOAD_TOO_LARGE', 'Body vượt quá 32 KB.');
    if (error.type === 'entity.parse.failed')
      e = new AppError(400, 'INVALID_JSON', 'JSON không hợp lệ.');
    if (
      error.type === 'encoding.unsupported' ||
      error.type === 'charset.unsupported'
    )
      e = new AppError(
        415,
        'UNSUPPORTED_MEDIA_TYPE',
        'Định dạng không được hỗ trợ.',
      );
  }
  if (e.status === 500)
    console.error(
      'Unhandled request error',
      error instanceof Error ? error.name : 'UnknownError',
    );
  res
    .status(e.status)
    .json({ error: { code: e.code, message: e.message, details: e.details } });
};
