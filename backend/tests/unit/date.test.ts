import { describe, expect, it } from 'vitest';
import { vietnamDate, vietnamDateTime } from '../../src/utils/date.js';

describe('Vietnam date formatting', () => {
  it('converts UTC day boundary and midnight correctly', () => {
    expect(vietnamDate(new Date('2026-10-07T18:00:00Z'))).toBe('2026-10-08');
    expect(vietnamDateTime(new Date('2026-10-07T17:00:00Z'))).toBe(
      '2026-10-08T00:00:00+07:00',
    );
  });
});
