import { describe, expect, it } from 'vitest';
import { idParams } from '../../src/middleware/validate.js';

describe('Integer ID route parameters', () => {
  it.each(['1', '25', '2147483647'])('parses %s as a numeric ID', (id) => {
    expect(idParams.parse({ id })).toEqual({ id: Number(id) });
  });

  it.each([
    '',
    '0',
    '-1',
    '01',
    '1.5',
    '+1',
    ' 1 ',
    '1e3',
    '2147483648',
    '9007199254740993',
    '10000000-0000-4000-8000-000000000001',
  ])('rejects invalid ID %j', (id) => {
    expect(idParams.safeParse({ id }).success).toBe(false);
  });
});
