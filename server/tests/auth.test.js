import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { authHeader } from './setup.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/auth';

beforeEach(() => vi.clearAllMocks());

describe('POST /auth/register', () => {
  it('returns 400 for invalid email', async () => {
    const res = await request(app).post(`${PREFIX}/register`).send({ email: 'bad', name: 'X', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for short password', async () => {
    const res = await request(app).post(`${PREFIX}/register`).send({ email: 'a@b.com', name: 'Valid', password: 'short' });
    expect(res.status).toBe(400);
  });

  it('calls register service and returns 201', async () => {
    const { default: svc } = await import('../src/modules/auth/auth.service.js');
    vi.spyOn(svc, 'register').mockResolvedValue({ token: 'tok', user: { id: 'u1', email: 'a@b.com' } });
    const res = await request(app).post(`${PREFIX}/register`).send({ email: 'a@b.com', name: 'Valid Name', password: 'password123' });
    expect(res.status).toBe(201);
  });
});

describe('POST /auth/login', () => {
  it('returns 400 for missing fields', async () => {
    const res = await request(app).post(`${PREFIX}/login`).send({});
    expect(res.status).toBe(400);
  });

  it('calls login service on valid input', async () => {
    const { default: svc } = await import('../src/modules/auth/auth.service.js');
    vi.spyOn(svc, 'login').mockResolvedValue({ token: 'tok', user: { id: 'u1' } });
    const res = await request(app).post(`${PREFIX}/login`).send({ email: 'a@b.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get(`${PREFIX}/me`);
    expect(res.status).toBe(401);
  });

  it('returns user with valid token', async () => {
    q.mockResolvedValue({ rows: [{ id: 'u1', email: 'test@example.com', name: 'Test' }] });
    const res = await request(app).get(`${PREFIX}/me`).set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /auth/logout', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).post(`${PREFIX}/logout`);
    expect(res.status).toBe(401);
  });

  it('returns 200 with valid token', async () => {
    const { default: svc } = await import('../src/modules/auth/auth.service.js');
    vi.spyOn(svc, 'logout').mockResolvedValue();
    const res = await request(app).post(`${PREFIX}/logout`).set(authHeader());
    expect(res.status).toBe(200);
  });
});
