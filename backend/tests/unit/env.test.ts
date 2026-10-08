import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../../src/config/env.js';

beforeEach(() => {
  vi.stubEnv('DATABASE_URL', 'mysql://test:test@localhost:3306/portal_test');
  vi.stubEnv('JWT_SECRET', 'test-secret-that-is-at-least-32-characters');
  for (const name of [
    'NODE_ENV',
    'PORT',
    'JWT_TTL_SECONDS',
    'ALLOWED_ORIGINS',
    'TRUST_PROXY_HOPS',
    'EDGE_PROXY_SECRET',
    'AUTH_WINDOW_MS',
    'LOGIN_IP_LIMIT',
    'LOGIN_ACCOUNT_LIMIT',
    'REGISTER_IP_LIMIT',
  ]) {
    vi.stubEnv(name, undefined);
  }
});

afterEach(() => vi.unstubAllEnvs());

describe('Environment configuration', () => {
  it('requires exactly one trusted hop when using the authenticated edge', () => {
    vi.stubEnv('EDGE_PROXY_SECRET', 'edge-secret-with-at-least-32-characters');
    expect(() => loadConfig()).toThrow('TRUST_PROXY_HOPS=1');
    vi.stubEnv('TRUST_PROXY_HOPS', '1');
    expect(loadConfig().TRUST_PROXY_HOPS).toBe(1);
  });
  it('provides typed defaults and parses environment strings', () => {
    expect(loadConfig()).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4000,
      JWT_TTL_SECONDS: 7200,
      TRUST_PROXY_HOPS: 0,
    });
    vi.stubEnv('PORT', '4010');
    vi.stubEnv('ALLOWED_ORIGINS', 'https://one.test, https://two.test ');
    expect(loadConfig()).toMatchObject({
      PORT: 4010,
      ALLOWED_ORIGINS: ['https://one.test', 'https://two.test'],
    });
  });

  it.each([
    ['PORT', '0'],
    ['PORT', '1.5'],
    ['JWT_TTL_SECONDS', '-1'],
    ['TRUST_PROXY_HOPS', '-1'],
    ['LOGIN_IP_LIMIT', 'invalid'],
    ['NODE_ENV', 'unknown'],
    ['DATABASE_URL', 'postgresql://test:test@localhost/portal_test'],
    ['JWT_SECRET', 'short'],
    ['JWT_SECRET', 'replace-with-a-long-placeholder-secret'],
    ['ALLOWED_ORIGINS', 'http://localhost:5173,'],
  ])('rejects invalid %s without disclosing its value', (name, value) => {
    vi.stubEnv(name, value);
    expect(() => loadConfig()).toThrow(`Invalid environment fields: ${name}`);
  });
});
