import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { EnrollmentService } from '../../src/modules/enrollments/enrollment.service.js';
import { CourseService } from '../../src/modules/courses/course.service.js';
import {
  setupIntegrationTests,
  app,
  db,
  studentCookie,
  studentId,
  cookieFor,
  makeCourse,
  createUser,
} from '../helpers/integration-context.js';
import { evidence } from '../helpers/test-evidence.js';

setupIntegrationTests();

describe('Concurrent enrollment and course updates', () => {
  it('allows exactly one of 20 concurrent users to take the final seat', async () => {
    const course = await makeCourse({ capacity: 10 });
    const service = new EnrollmentService(db);
    for (let i = 0; i < 9; i++)
      await service.enroll((await createUser()).id, course.id);
    const users = await Promise.all(
      Array.from({ length: 20 }, () => createUser()),
    );
    const results = await Promise.all(
      users.map((u) =>
        request(app)
          .post(`/api/courses/${course.id}/enrollments`)
          .set('Cookie', cookieFor(u.id)),
      ),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(
      results.filter(
        (r) => r.status === 409 && r.body.error.code === 'COURSE_FULL',
      ),
    ).toHaveLength(19);
    expect(await db.enrollment.count({ where: { courseId: course.id } })).toBe(
      10,
    );
    expect(
      (await db.course.findUniqueOrThrow({ where: { id: course.id } }))
        .enrolledCount,
    ).toBe(10);
    evidence.push({
      name: '20 concurrent requests for last seat',
      successful: 1,
      courseFull: 19,
      enrolledCount: 10,
      enrollmentRows: 10,
    });
  });
  it('deduplicates concurrent requests from one student', async () => {
    const course = await makeCourse({ capacity: 20 });
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app)
          .post(`/api/courses/${course.id}/enrollments`)
          .set('Cookie', studentCookie),
      ),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(
      results.filter((r) => r.body.error?.code === 'ALREADY_ENROLLED'),
    ).toHaveLength(9);
    expect(
      (await db.course.findUniqueOrThrow({ where: { id: course.id } }))
        .enrolledCount,
    ).toBe(1);
  });
  it('serializes capacity/hide changes with enrollment', async () => {
    const service = new EnrollmentService(db);
    const courses = new CourseService(db);
    const course = await makeCourse();
    await service.enroll(studentId, course.id);
    const other = await createUser();
    await Promise.allSettled([
      service.enroll(other.id, course.id),
      courses.update(course.id, { capacity: 1 }),
    ]);
    const final = await db.course.findUniqueOrThrow({
      where: { id: course.id },
    });
    expect(final.enrolledCount).toBeLessThanOrEqual(final.capacity);
    expect(final.enrolledCount).toBe(
      await db.enrollment.count({ where: { courseId: course.id } }),
    );
    const hidden = await makeCourse();
    await Promise.allSettled([
      service.enroll(studentId, hidden.id),
      courses.update(hidden.id, { isPublished: false }),
    ]);
    expect(
      (await db.course.findUniqueOrThrow({ where: { id: hidden.id } }))
        .isPublished,
    ).toBe(false);
    await expect(service.enroll(other.id, hidden.id)).rejects.toMatchObject({
      code: 'COURSE_NOT_FOUND',
    });
  });
});
