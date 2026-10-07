import { Prisma, type PrismaClient } from '@prisma/client';
import { AppError } from '../../utils/app-error.js';
import { lockCourse, transaction } from '../../lib/transaction.js';
import type {
  CourseQuery,
  CreateCourseRequestDto,
  UpdateCourseRequestDto,
} from './course.schema.js';
export class CourseService {
  constructor(private db: PrismaClient) {}
  async list(query: CourseQuery, admin = false) {
    const where: Prisma.CourseWhereInput = {
      ...(admin ? {} : { isPublished: true }),
      ...(query.search
        ? { title: { contains: query.search.replace(/[\\%_]/g, '\\$&') } }
        : {}),
      ...(query.category ? { category: query.category } : {}),
    };
    const [items, total] = await this.db.$transaction(
      [
        this.db.course.findMany({
          where,
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        }),
        this.db.course.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return { items, total };
  }
  async detail(id: number, admin = false) {
    const course = await this.db.course.findUnique({ where: { id } });
    if (!course || (!admin && !course.isPublished))
      throw new AppError(404, 'COURSE_NOT_FOUND', 'Không tìm thấy khóa học.');
    return course;
  }
  async categories() {
    const rows = await this.db.course.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return rows.map((r) => r.category);
  }
  create(data: CreateCourseRequestDto) {
    return this.db.course.create({ data });
  }
  update(id: number, data: UpdateCourseRequestDto) {
    return transaction(this.db, async (tx) => {
      const course = await lockCourse(tx, id);
      if (data.capacity !== undefined && data.capacity < course.enrolledCount)
        throw new AppError(
          409,
          'CAPACITY_TOO_LOW',
          'Sĩ số không được thấp hơn số học viên đã ghi danh.',
        );
      return tx.course.update({ where: { id }, data });
    });
  }
  remove(id: number) {
    return transaction(this.db, async (tx) => {
      const course = await lockCourse(tx, id);
      if (
        course.enrolledCount > 0 ||
        (await tx.enrollment.count({ where: { courseId: id } }))
      )
        throw new AppError(
          409,
          'COURSE_HAS_ENROLLMENTS',
          'Khóa học đã có học viên. Hãy ẩn khóa học.',
        );
      await tx.course.delete({ where: { id } });
    });
  }
}
