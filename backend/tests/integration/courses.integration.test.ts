import { describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  setupIntegrationTests,
  app,
  adminCookie,
  courseBody,
  makeCourse,
} from '../helpers/integration-context.js';
import { record } from '../helpers/test-evidence.js';

setupIntegrationTests();

describe('Course management API', () => {
  it('creates, lists, updates and deletes course with safe response', async () => {
    const created = await request(app)
      .post('/api/admin/courses')
      .set('Cookie', adminCookie)
      .send(courseBody());
    expect(created.status).toBe(201);
    expect(Number.isInteger(created.body.data.id)).toBe(true);
    record(
      'Create course',
      'POST',
      '/api/admin/courses',
      created,
      courseBody(),
    );
    const id = created.body.data.id;
    const detail = await request(app).get(`/api/courses/${id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.isPublished).toBeUndefined();
    record('Read course', 'GET', `/api/courses/${id}`, detail);
    const updated = await request(app)
      .patch(`/api/admin/courses/${id}`)
      .set('Cookie', adminCookie)
      .send({ capacity: 5 });
    expect(updated.body.data.capacity).toBe(5);
    record('Update course', 'PATCH', `/api/admin/courses/${id}`, updated, {
      capacity: 5,
    });
    const deleted = await request(app)
      .delete(`/api/admin/courses/${id}`)
      .set('Cookie', adminCookie);
    expect(deleted.status).toBe(204);
    expect(deleted.text).toBe('');
    record('Delete course', 'DELETE', `/api/admin/courses/${id}`, deleted);
  });
  it('filters by name/category, hides unpublished courses and paginates consistently', async () => {
    await makeCourse();
    await makeCourse({ title: 'MOS Excel', category: 'MOS' });
    await makeCourse({ isPublished: false, category: 'Hidden' });
    const list = await request(app).get(
      '/api/courses?search=react&category=Co-op%20IT&limit=1',
    );
    expect(list.body.meta.total).toBe(1);
    expect(list.body.data).toHaveLength(1);
    expect((await request(app).get('/api/courses?page=99')).body.data).toEqual(
      [],
    );
    expect((await request(app).get('/api/categories')).body.data).toEqual([
      'Co-op IT',
      'MOS',
    ]);
    expect(
      (await request(app).get('/api/admin/courses').set('Cookie', adminCookie))
        .body.meta.total,
    ).toBe(3);
    expect((await request(app).get('/api/courses?limit=101')).status).toBe(400);
    expect((await request(app).get('/api/courses?page=1&page=2')).status).toBe(
      400,
    );
    expect((await request(app).get('/api/courses/not-an-id')).status).toBe(400);
    expect((await request(app).get('/api/courses/2147483647')).status).toBe(
      404,
    );
  });
  it('rejects invalid amounts and capacity', async () => {
    for (const data of [
      { capacity: 0 },
      { capacity: 1.5 },
      { tuitionVnd: -1 },
      { title: ' ' },
    ]) {
      expect(
        (
          await request(app)
            .post('/api/admin/courses')
            .set('Cookie', adminCookie)
            .send(courseBody(data))
        ).status,
      ).toBe(400);
    }
  });
});
