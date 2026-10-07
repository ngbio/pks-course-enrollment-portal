import { Prisma, type PrismaClient } from '@prisma/client';
import { lockCourse, transaction } from '../../lib/transaction.js';
import { AppError } from '../../utils/app-error.js';
import type { Pagination } from '../../middleware/validate.js';
export class EnrollmentService {
  constructor(private db: PrismaClient) {}
  async enroll(userId: number, courseId: number) {
    try {
      return await transaction(this.db, async (tx) => {
        const course = await lockCourse(tx, courseId);
        if (!course.isPublished)
          throw new AppError(
            404,
            'COURSE_NOT_FOUND',
            'Không tìm thấy khóa học.',
          );
        const duplicate = await tx.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId } },
          select: { id: true },
        });
        if (duplicate)
          throw new AppError(
            409,
            'ALREADY_ENROLLED',
            'Bạn đã ghi danh khóa học này.',
          );
        if (course.enrolledCount >= course.capacity)
          throw new AppError(409, 'COURSE_FULL', 'Khóa học đã hết chỗ.');
        const enrollment = await tx.enrollment.create({
          data: { userId, courseId },
        });
        await tx.course.update({
          where: { id: courseId },
          data: { enrolledCount: { increment: 1 } },
        });
        return enrollment;
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      )
        throw new AppError(
          409,
          'ALREADY_ENROLLED',
          'Bạn đã ghi danh khóa học này.',
        );
      throw e;
    }
  }
  async mine(userId: number, query: Pagination) {
    const where = { userId };
    const [items, total] = await this.db.$transaction(
      [
        this.db.enrollment.findMany({
          where,
          include: { course: true },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: [{ enrolledAt: 'desc' }, { id: 'asc' }],
        }),
        this.db.enrollment.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return { items, total };
  }
  async forCourse(courseId: number, query: Pagination) {
    if (
      !(await this.db.course.findUnique({
        where: { id: courseId },
        select: { id: true },
      }))
    )
      throw new AppError(404, 'COURSE_NOT_FOUND', 'Không tìm thấy khóa học.');
    const where = { courseId };
    const [items, total] = await this.db.$transaction(
      [
        this.db.enrollment.findMany({
          where,
          include: {
            user: { select: { id: true, fullName: true, email: true } },
            course: { select: { title: true } },
          },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: [{ enrolledAt: 'desc' }, { id: 'asc' }],
        }),
        this.db.enrollment.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return { items, total };
  }
}
