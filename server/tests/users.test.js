import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { authHeader } from './setup.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/users';
beforeEach(() => vi.clearAllMocks());

describe('GET /users/me/subscriptions', () => {
  it('requires auth', async () => {
    const res = await request(app).get(`${PREFIX}/me/subscriptions`);
    expect(res.status).toBe(401);
  });

  it('returns subscriptions with auth', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${PREFIX}/me/subscriptions`).set(authHeader());
    expect(res.status).toBe(200);
  });
});

describe('GET /users/me/saved-jobs', () => {
  it('requires auth', async () => {
    const res = await request(app).get(`${PREFIX}/me/saved-jobs`);
    expect(res.status).toBe(401);
  });

  it('returns saved jobs with auth', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${PREFIX}/me/saved-jobs`).set(authHeader());
    expect(res.status).toBe(200);
  });
});

describe('GET /users/me/agenda', () => {
  it('requires auth', async () => {
    const res = await request(app).get(`${PREFIX}/me/agenda`);
    expect(res.status).toBe(401);
  });

  it('returns agenda with auth', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${PREFIX}/me/agenda`).set(authHeader());
    expect(res.status).toBe(200);
  });
});
