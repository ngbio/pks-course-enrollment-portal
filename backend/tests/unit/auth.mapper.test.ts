import { describe, expect, it } from 'vitest';
import { toUserResponse } from '../../src/modules/auth/auth.mapper.js';

describe('User response mapper', () => {
  it('removes unknown sensitive fields from response at runtime', () => {
    const user = {
      id: 1,
      fullName: 'A',
      email: 'a@test.com',
      role: 'STUDENT' as const,
      passwordHash: 'secret',
      token: 'secret',
    };
    expect(Object.keys(toUserResponse(user)).sort()).toEqual([
      'email',
      'fullName',
      'id',
      'role',
    ]);
  });
});
