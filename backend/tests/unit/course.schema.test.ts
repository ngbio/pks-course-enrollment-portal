import { describe, expect, it } from 'vitest';
import {
  courseCreateSchema,
  courseUpdateSchema,
  courseListSchema,
} from '../../src/modules/courses/course.schema.js';
const request = (body: unknown) => ({ body, params: {}, query: {} });

describe('Course request schemas', () => {
  it('rejects empty patch and count injection', () => {
    const params = { id: '1' };
    expect(
      courseUpdateSchema.safeParse({ ...request({}), params }).success,
    ).toBe(false);
    expect(
      courseUpdateSchema.safeParse({ ...request({ enrolledCount: 1 }), params })
        .success,
    ).toBe(false);
  });
  it.each([
    { limit: '101' },
    { page: '-1' },
    { page: '1.5' },
    { page: ['1', '2'] },
    { search: ['a', 'b'] },
  ])('rejects invalid query %j', (query) => {
    expect(courseListSchema.safeParse({ ...request({}), query }).success).toBe(
      false,
    );
  });
  it('rejects tuition exceeding MySQL INT', () => {
    const body = {
      title: 'Test',
      category: 'IT',
      instructor: 'Teacher',
      shortDescription: 'Short',
      description: 'Details',
      capacity: 1,
      tuitionVnd: 2147483648,
    };
    expect(courseCreateSchema.safeParse(request(body)).success).toBe(false);
  });
});
