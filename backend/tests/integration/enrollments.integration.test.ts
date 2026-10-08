import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { EnrollmentService } from '../../src/modules/enrollments/enrollment.service.js';
import {
  setupIntegrationTests,
  app,
  db,
  adminCookie,
  studentCookie,
  studentId,
  cookieFor,
  makeCourse,
  createUser,
} from '../helpers/integration-context.js';
import { record } from '../helpers/test-evidence.js';

setupIntegrationTests();

describe('Enrollment API and invariants', () => {
  it('enrolls once, rejects full/duplicate, preserves owner history after hide', async () => {
    const course = await makeCourse({ capacity: 1 });
    const path = `/api/courses/${course.id}/enrollments`;
    expect((await request(app).post(path)).status).toBe(401);
    const enrolled = await request(app).post(path).set('Cookie', studentCookie);
    expect(enrolled.status).toBe(201);
    expect(Number.isInteger(enrolled.body.data.id)).toBe(true);
    expect(enrolled.body.data.courseId).toBe(course.id);
    expect(enrolled.body.data.enrolledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    record('Enroll', 'POST', path, enrolled);
    const duplicate = await request(app)
      .post(path)
      .set('Cookie', studentCookie);
    expect(duplicate.body.error.code).toBe('ALREADY_ENROLLED');
    record('Duplicate enrollment', 'POST', path, duplicate);
    const other = await createUser();
    const full = await request(app)
      .post(path)
      .set('Cookie', cookieFor(other.id));
    expect(full.body.error.code).toBe('COURSE_FULL');
    record('Full course', 'POST', path, full);
    const tooLow = await request(app)
      .patch(`/api/admin/courses/${course.id}`)
      .set('Cookie', adminCookie)
      .send({ capacity: 0 });
    expect(tooLow.status).toBe(400);
    expect(
      (
        await request(app)
          .delete(`/api/admin/courses/${course.id}`)
          .set('Cookie', adminCookie)
      ).status,
    ).toBe(409);
    await request(app)
      .patch(`/api/admin/courses/${course.id}`)
      .set('Cookie', adminCookie)
      .send({ isPublished: false });
    expect((await request(app).get(`/api/courses/${course.id}`)).status).toBe(
      404,
    );
    expect(
      (await request(app).post(path).set('Cookie', cookieFor(other.id))).status,
    ).toBe(404);
    const mine = await request(app)
      .get('/api/me/enrollments')
      .set('Cookie', studentCookie);
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.data[0].course.isPublished).toBe(false);
    expect(
      (
        await request(app)
          .get('/api/me/enrollments')
          .set('Cookie', cookieFor(other.id))
      ).body.data,
    ).toEqual([]);
    expect(
      (
        await request(app)
          .get(`/api/me/enrollments?userId=${studentId}`)
          .set('Cookie', cookieFor(other.id))
      ).status,
    ).toBe(400);
    const adminList = await request(app)
      .get(`/api/admin/courses/${course.id}/enrollments`)
      .set('Cookie', adminCookie);
    expect(adminList.body.data[0].student.id).toBe(studentId);
    expect(JSON.stringify(adminList.body)).not.toContain('passwordHash');
  });
  it('blocks capacity below actual count', async () => {
    const course = await makeCourse();
    const other = await createUser();
    const service = new EnrollmentService(db);
    await service.enroll(studentId, course.id);
    await service.enroll(other.id, course.id);
    const r = await request(app)
      .patch(`/api/admin/courses/${course.id}`)
      .set('Cookie', adminCookie)
      .send({ capacity: 1 });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('CAPACITY_TOO_LOW');
    record(
      'Capacity below enrollment',
      'PATCH',
      `/api/admin/courses/${course.id}`,
      r,
      { capacity: 1 },
    );
  });
});
