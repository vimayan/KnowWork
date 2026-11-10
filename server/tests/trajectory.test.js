import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/trajectory';
beforeEach(() => vi.clearAllMocks());

describe('GET /trajectory/:id/graph', () => {
  it('returns nodes and edges', async () => {
    q.mockResolvedValueOnce({ rows: [{ id: 'jc1', title: 'Software Engineer' }] })
     .mockResolvedValueOnce({ rows: [] })
     .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get(`${PREFIX}/jc1/graph`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('nodes');
  });

  it('returns 404 for unknown job card', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${PREFIX}/unknown/graph`);
    expect(res.status).toBe(404);
  });
});

describe('GET /trajectory/:id/compare', () => {
  it('returns comparison paths', async () => {
    q.mockResolvedValueOnce({ rows: [{ id: 'jc1' }] })
     .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get(`${PREFIX}/jc1/compare?types=industry`);
    expect(res.status).toBe(200);
  });
});

describe('GET /trajectory/:id/failure-map', () => {
  it('returns failure risk data', async () => {
    q.mockResolvedValueOnce({ rows: [{ id: 'jc1' }] })
     .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get(`${PREFIX}/jc1/failure-map`);
    expect(res.status).toBe(200);
  });
});
