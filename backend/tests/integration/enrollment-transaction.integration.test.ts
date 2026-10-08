import { describe, expect, it } from 'vitest';
import { EnrollmentService } from '../../src/modules/enrollments/enrollment.service.js';
import {
  setupIntegrationTests,
  db,
  studentId,
  makeCourse,
} from '../helpers/integration-context.js';

setupIntegrationTests();

describe('Enrollment transaction rollback', () => {
  it('rolls back inserted enrollment when count update fails', async () => {
    const course = await makeCourse({ title: 'Force rollback' });
    try {
      // A temporary DB constraint fails the second write after Enrollment INSERT.
      // No SUPER privilege, server-wide setting or mocked transaction is needed.
      await db.$executeRawUnsafe(
        "ALTER TABLE courses ADD CONSTRAINT test_fail_count CHECK (title <> 'Force rollback' OR enrolled_count = 0)",
      );
      await expect(
        new EnrollmentService(db).enroll(studentId, course.id),
      ).rejects.toThrow();
      expect(
        await db.enrollment.count({ where: { courseId: course.id } }),
      ).toBe(0);
      expect(
        (await db.course.findUniqueOrThrow({ where: { id: course.id } }))
          .enrolledCount,
      ).toBe(0);
    } finally {
      await db.$executeRawUnsafe(
        'ALTER TABLE courses DROP CHECK test_fail_count',
      );
    }
  });
});
