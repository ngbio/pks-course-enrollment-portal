import { Prisma, type PrismaClient } from '@prisma/client';
import { AppError } from '../utils/app-error.js';
export async function transaction<T>(
  db: PrismaClient,
  action: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(action, {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10000,
        timeout: 15000,
      });
    } catch (e) {
      if (
        !(e instanceof Prisma.PrismaClientKnownRequestError) ||
        e.code !== 'P2034'
      )
        throw e;
      if (attempt >= 2)
        throw new AppError(
          409,
          'CONCURRENT_UPDATE',
          'Dữ liệu đang thay đổi. Vui lòng thử lại.',
        );
    }
  }
}
export async function lockCourse(tx: Prisma.TransactionClient, id: number) {
  await tx.$queryRaw`SELECT id FROM courses WHERE id = ${id} FOR UPDATE`;
  const course = await tx.course.findUnique({ where: { id } });
  if (!course)
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Không tìm thấy khóa học.');
  return course;
}
