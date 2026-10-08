import { describe, expect, it } from 'vitest';
import { EnrollmentService } from '../../src/modules/enrollments/enrollment.service.js';
import {
  setupIntegrationTests,
  db,
  studentId,
  makeCourse,
} from '../helpers/integration-context.js';

setupIntegrationTests();

describe('MySQL integrity constraints', () => {
  it('enforces MySQL CHECK, unique, foreign key and InnoDB', async () => {
    const course = await makeCourse();
    for (const data of [
      { capacity: 0 },
      { enrolledCount: 3 },
      { tuitionVnd: -1 },
    ])
      await expect(
        db.course.update({ where: { id: course.id }, data }),
      ).rejects.toThrow();
    await new EnrollmentService(db).enroll(studentId, course.id);
    await expect(
      db.enrollment.create({
        data: { userId: studentId, courseId: course.id },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
    await expect(
      db.course.delete({ where: { id: course.id } }),
    ).rejects.toMatchObject({ code: 'P2003' });
    const engines = await db.$queryRaw<
      { ENGINE: string }[]
    >`SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('users','courses','enrollments')`;
    expect(engines).toHaveLength(3);
    expect(engines.every((e) => e.ENGINE === 'InnoDB')).toBe(true);
  });
});
