import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { authHeader } from './setup.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/community';
beforeEach(() => vi.clearAllMocks());

const mockCommunity = { id: 'c1', name: 'Frontend Devs', member_count: 120 };

describe('GET /community', () => {
  it('returns community list', async () => {
    q.mockResolvedValue({ rows: [mockCommunity] });
    const res = await request(app).get(PREFIX);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /community/:id/join', () => {
  it('requires auth', async () => {
    const res = await request(app).post(`${PREFIX}/c1/join`);
    expect(res.status).toBe(401);
  });

  it('joins community with auth', async () => {
    q.mockResolvedValue({ rows: [{ id: 'cm1', community_id: 'c1', user_id: 'u1' }] });
    const res = await request(app).post(`${PREFIX}/c1/join`).set(authHeader());
    expect(res.status).toBe(200);
  });
});

describe('GET /community/:id/posts', () => {
  it('returns posts list', async () => {
    q.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: '0' }] });
    const res = await request(app).get(`${PREFIX}/c1/posts`);
    expect(res.status).toBe(200);
  });
});

describe('POST /community/:id/posts', () => {
  it('requires auth', async () => {
    const res = await request(app).post(`${PREFIX}/c1/posts`).send({ content: 'Hello!' });
    expect(res.status).toBe(401);
  });

  it('creates post with auth', async () => {
    q.mockResolvedValue({ rows: [{ id: 'post1', content: 'Hello!' }] });
    const res = await request(app).post(`${PREFIX}/c1/posts`)
      .set(authHeader())
      .send({ content: 'Hello world!' });
    expect(res.status).toBe(201);
  });
});
