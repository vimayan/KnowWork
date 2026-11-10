import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/education';
beforeEach(() => vi.clearAllMocks());

describe('GET /education/:id/subjects', () => {
  it('returns subjects for job card', async () => {
    q.mockResolvedValue({ rows: [{ id: 's1', name: 'Data Structures' }] });
    const res = await request(app).get(`${PREFIX}/jc1/subjects`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /education/:id/degrees', () => {
  it('returns relevant degrees', async () => {
    q.mockResolvedValue({ rows: [{ id: 'd1', name: 'B.Tech Computer Science' }] });
    const res = await request(app).get(`${PREFIX}/jc1/degrees`);
    expect(res.status).toBe(200);
  });
});

describe('GET /education/:id/institutes', () => {
  it('returns institutes list', async () => {
    q.mockResolvedValueOnce({ rows: [] })
     .mockResolvedValueOnce({ rows: [{ count: '0' }] });
    const res = await request(app).get(`${PREFIX}/jc1/institutes`);
    expect(res.status).toBe(200);
  });
});
