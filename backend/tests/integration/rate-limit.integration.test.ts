import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import {
  setupIntegrationTests,
  db,
  config,
  password,
} from '../helpers/integration-context.js';

setupIntegrationTests();

describe('Authentication rate limits', () => {
  it('rate limits login by IP and failed account, and register by IP', async () => {
    const limited = createApp(db, {
      ...config,
      LOGIN_IP_LIMIT: 1,
      REGISTER_IP_LIMIT: 1,
    });
    const data = { email: 'unknown@test.com', password };
    expect(
      (await request(limited).post('/api/auth/login').send(data)).status,
    ).toBe(401);
    expect(
      (await request(limited).post('/api/auth/login').send(data)).status,
    ).toBe(429);
    await request(limited)
      .post('/api/auth/register')
      .send({ ...data, fullName: 'Tester' });
    expect(
      (
        await request(limited)
          .post('/api/auth/register')
          .send({ ...data, fullName: 'Tester' })
      ).status,
    ).toBe(429);
    const accountLimited = createApp(db, { ...config, LOGIN_ACCOUNT_LIMIT: 1 });
    const wrongPassword = { ...data, password: 'Definitely-wrong-password' };
    expect(
      (
        await request(accountLimited)
          .post('/api/auth/login')
          .send(wrongPassword)
      ).status,
    ).toBe(401);
    expect(
      (
        await request(accountLimited)
          .post('/api/auth/login')
          .send(wrongPassword)
      ).status,
    ).toBe(429);
  });
});
