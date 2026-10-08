import { describe, expect, it } from 'vitest';
import { registerSchema } from '../../src/modules/auth/auth.schema.js';
const credentials = {
  fullName: 'Test Student',
  email: ' TEST@EXAMPLE.COM ',
  password: 'a-long-password',
};
const request = (body: unknown) => ({ body, params: {}, query: {} });

describe('Registration request schema', () => {
  it('normalizes email and keeps password unchanged', () => {
    const output = registerSchema.parse(
      request({ ...credentials, password: ' password ' }),
    );
    expect(output.body.email).toBe('test@example.com');
    expect(output.body.password).toBe(' password ');
  });
  it('rejects role injection', () =>
    expect(
      registerSchema.safeParse(request({ ...credentials, role: 'ADMIN' }))
        .success,
    ).toBe(false));
  it('checks bcrypt limit in bytes, not characters', () =>
    expect(
      registerSchema.safeParse(
        request({ ...credentials, password: 'ế'.repeat(25) }),
      ).success,
    ).toBe(false));
});
