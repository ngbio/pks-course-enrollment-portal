import { describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  setupIntegrationTests,
  app,
  studentCookie,
  cookieFor,
  courseBody,
  makeCourse,
  createUser,
} from '../helpers/integration-context.js';
import { record } from '../helpers/test-evidence.js';

setupIntegrationTests();

describe('API role authorization', () => {
  it('protects every admin operation and accepts staff', async () => {
    const course = await makeCourse();
    const paths = [
      '/api/admin/courses',
      `/api/admin/courses/${course.id}`,
      `/api/admin/courses/${course.id}/enrollments`,
    ];
    for (const path of paths) {
      const guest = await request(app).get(path);
      expect(guest.status).toBe(401);
      const student = await request(app).get(path).set('Cookie', studentCookie);
      expect(student.status).toBe(403);
      record('Protected admin API', 'GET', path, student);
    }
    expect(
      (
        await request(app)
          .post('/api/admin/courses')
          .set('Cookie', studentCookie)
          .send(courseBody())
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .patch(`/api/admin/courses/${course.id}`)
          .set('Cookie', studentCookie)
          .send({ capacity: 3 })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .delete(`/api/admin/courses/${course.id}`)
          .set('Cookie', studentCookie)
      ).status,
    ).toBe(403);
    const staff = await createUser('STAFF');
    expect(
      (
        await request(app)
          .post('/api/admin/courses')
          .set('Cookie', cookieFor(staff.id))
          .send(courseBody())
      ).status,
    ).toBe(201);
  });
});
