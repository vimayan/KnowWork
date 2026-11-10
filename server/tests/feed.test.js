import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/feed';
beforeEach(() => vi.clearAllMocks());

describe('GET /feed', () => {
  it('returns feed items', async () => {
    q.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: '0' }] });
    const res = await request(app).get(PREFIX);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('supports page param', async () => {
    q.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: '0' }] });
    const res = await request(app).get(`${PREFIX}?page=2`);
    expect(res.status).toBe(200);
  });
});

describe('GET /feed/trending', () => {
  it('returns trending items', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${PREFIX}/trending`);
    expect(res.status).toBe(200);
  });
});
