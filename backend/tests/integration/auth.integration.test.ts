import { describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import {
  setupIntegrationTests,
  app,
  db,
  config,
  password,
  studentCookie,
  studentId,
  cookieFor,
} from '../helpers/integration-context.js';
import { record } from '../helpers/test-evidence.js';

setupIntegrationTests();

describe('Authentication API', () => {
  it('rejects JWT subjects that are not positive MySQL INT IDs', async () => {
    for (const subject of [
      '0',
      '-1',
      '1.5',
      '2147483648',
      '10000000-0000-4000-8000-000000000001',
    ]) {
      const token = jwt.sign({}, config.JWT_SECRET, {
        subject,
        expiresIn: 60,
        issuer: 'pks-api',
        audience: 'pks-portal',
      });
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `pks_session=${token}`);
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    }
  });
  it('registers, hashes password and blocks case-insensitive duplicate email', async () => {
    const data = {
      fullName: 'New Student',
      email: ' NEW@EXAMPLE.COM ',
      password,
    };
    const r = await request(app).post('/api/auth/register').send(data);
    expect(r.status).toBe(201);
    expect(Number.isInteger(r.body.data.id)).toBe(true);
    expect(r.body.data.role).toBe('STUDENT');
    expect(r.body.data.passwordHash).toBeUndefined();
    const stored = await db.user.findUniqueOrThrow({
      where: { email: 'new@example.com' },
    });
    expect(await bcrypt.compare(password, stored.passwordHash)).toBe(true);
    expect(bcrypt.getRounds(stored.passwordHash)).toBe(12);
    const duplicate = await request(app)
      .post('/api/auth/register')
      .send({ ...data, email: 'new@example.com' });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('EMAIL_EXISTS');
    record('Duplicate email', 'POST', '/api/auth/register', duplicate, {
      ...data,
      password: '[redacted]',
    });
  });
  it('login persists cookie, /me omits hash, logout clears session', async () => {
    const student = await db.user.findUniqueOrThrow({
      where: { id: studentId },
    });
    const agent = request.agent(app);
    const login = await agent
      .post('/api/auth/login')
      .send({ email: student.email, password });
    expect(login.status).toBe(200);
    expect(String(login.headers['set-cookie'])).toContain('HttpOnly');
    expect(String(login.headers['set-cookie'])).toContain('SameSite=Lax');
    expect(login.body.data.passwordHash).toBeUndefined();
    expect(login.body.token).toBeUndefined();
    expect((await agent.get('/api/auth/me')).status).toBe(200);
    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(204);
    expect(logout.text).toBe('');
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
  it('rejects wrong password, invalid and expired JWT', async () => {
    const student = await db.user.findUniqueOrThrow({
      where: { id: studentId },
    });
    expect(
      (
        await request(app)
          .post('/api/auth/login')
          .send({ email: student.email, password: 'incorrect-password' })
      ).status,
    ).toBe(401);
    for (const cookie of ['pks_session=invalid', cookieFor(studentId, -1)])
      expect(
        (await request(app).get('/api/auth/me').set('Cookie', cookie)).status,
      ).toBe(401);
  });
  it('rejects JWT with missing expiry or wrong algorithm and checks current database role', async () => {
    for (const token of [
      jwt.sign({}, config.JWT_SECRET, {
        subject: String(studentId),
        issuer: 'pks-api',
        audience: 'pks-portal',
      }),
      jwt.sign({}, config.JWT_SECRET, {
        subject: String(studentId),
        algorithm: 'HS384',
        expiresIn: 60,
        issuer: 'pks-api',
        audience: 'pks-portal',
      }),
    ]) {
      expect(
        (
          await request(app)
            .get('/api/auth/me')
            .set('Cookie', `pks_session=${token}`)
        ).status,
      ).toBe(401);
    }
    await db.user.update({ where: { id: studentId }, data: { role: 'STAFF' } });
    expect(
      (
        await request(app)
          .get('/api/admin/courses')
          .set('Cookie', studentCookie)
      ).status,
    ).toBe(200);
  });
});
