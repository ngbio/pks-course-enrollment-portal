import { describe, expect, it } from 'vitest';
import { databaseUrl } from '../../src/config/database.js';

const fields = {
  DB_HOST: 'mysql.example.test',
  DB_PORT: '25060',
  DB_USER: 'student@user',
  DB_PASSWORD: 'p@ss:/#% word',
  DB_NAME: 'pks_portal',
};

describe('Database environment fields', () => {
  it('converts Aiven REQUIRED mode to Prisma TLS without a CA file', () => {
    const url = new URL(
      databaseUrl({
        DATABASE_URL:
          'mysql://user:password@mysql.example.test:24031/defaultdb?ssl-mode=REQUIRED&connection_limit=5',
      }),
    );
    expect(url.searchParams.has('ssl-mode')).toBe(false);
    expect(url.searchParams.get('sslaccept')).toBe('accept_invalid_certs');
    expect(url.searchParams.has('sslcert')).toBe(false);
    expect(url.searchParams.get('connection_limit')).toBe('5');
    expect(url.pathname).toBe('/defaultdb');
  });
  it('preserves explicit certificate verification with Aiven REQUIRED mode', () => {
    const url = new URL(
      databaseUrl({
        DATABASE_URL:
          'mysql://user:password@mysql.example.test/defaultdb?ssl-mode=REQUIRED&sslaccept=strict&sslcert=/etc/secrets/ca.pem',
      }),
    );
    expect(url.searchParams.get('sslaccept')).toBe('strict');
    expect(url.searchParams.get('sslcert')).toBe('/etc/secrets/ca.pem');
  });
  it('encodes credentials and CA paths without changing their values', () => {
    const url = new URL(
      databaseUrl({ ...fields, DB_SSL_CA: 'E:/Private CA/ca.pem' }),
    );
    expect(url.hostname).toBe(fields.DB_HOST);
    expect(url.port).toBe(fields.DB_PORT);
    expect(url.pathname).toBe('/pks_portal');
    expect(decodeURIComponent(url.username)).toBe(fields.DB_USER);
    expect(decodeURIComponent(url.password)).toBe(fields.DB_PASSWORD);
    expect(url.searchParams.get('sslcert')).toBe('E:/Private CA/ca.pem');
    expect(url.searchParams.get('sslaccept')).toBe('strict');
  });
  it('keeps explicit test URLs independent of local DB fields', () => {
    const DATABASE_URL = 'mysql://test:test@localhost:3306/portal_test';
    expect(databaseUrl({ ...fields, DATABASE_URL })).toBe(DATABASE_URL);
  });
  it('defaults the port and omits TLS options for local MySQL', () => {
    const url = new URL(databaseUrl({ ...fields, DB_PORT: undefined }));
    expect(url.port).toBe('3306');
    expect(url.searchParams.has('sslcert')).toBe(false);
    expect(url.searchParams.get('connection_limit')).toBe('5');
  });
  it.each([
    ['DB_HOST', 'https://mysql.example.test'],
    ['DB_PORT', '0'],
    ['DB_PORT', '65536'],
    ['DB_USER', ''],
    ['DB_PASSWORD', ''],
    ['DB_NAME', 'portal/other'],
  ])('rejects invalid %s without printing secrets', (name, value) => {
    expect(() => databaseUrl({ ...fields, [name]: value })).toThrow(
      `Invalid database fields: ${name}`,
    );
  });
});
