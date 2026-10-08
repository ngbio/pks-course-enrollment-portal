import { describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  setupIntegrationTests,
  app,
  db,
  password,
  adminCookie,
  studentCookie,
  makeCourse,
} from '../helpers/integration-context.js';

setupIntegrationTests();

describe('Request DTO validation', () => {
  it('blocks privileged field injection and empty PATCH', async () => {
    expect(
      (
        await request(app).post('/api/auth/register').send({
          fullName: 'Test',
          email: 'test@example.com',
          password,
          role: 'ADMIN',
        })
      ).status,
    ).toBe(400);
    const course = await makeCourse();
    for (const payload of [{}, { enrolledCount: 1 }])
      expect(
        (
          await request(app)
            .patch(`/api/admin/courses/${course.id}`)
            .set('Cookie', adminCookie)
            .send(payload)
        ).status,
      ).toBe(400);
    expect(
      (
        await request(app)
          .post(`/api/courses/${course.id}/enrollments`)
          .set('Cookie', studentCookie)
          .send({ userId: 999 })
      ).status,
    ).toBe(400);
    expect(await db.enrollment.count()).toBe(0);
  });
});
