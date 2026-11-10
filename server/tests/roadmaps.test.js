import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { authHeader } from './setup.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/roadmaps';
beforeEach(() => vi.clearAllMocks());

const mockRoadmap = { id: 'r1', title: 'Full Stack Path', job_card_id: 'jc1', likes: 10 };

describe('GET /roadmaps', () => {
  it('returns roadmap list', async () => {
    q.mockResolvedValueOnce({ rows: [mockRoadmap] })
     .mockResolvedValueOnce({ rows: [{ count: '1' }] });
    const res = await request(app).get(PREFIX);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /roadmaps/:id', () => {
  it('returns 404 for unknown id', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${PREFIX}/bad-id`);
    expect(res.status).toBe(404);
  });

  it('returns roadmap with nodes', async () => {
    q.mockResolvedValueOnce({ rows: [mockRoadmap] })
     .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get(`${PREFIX}/r1`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('r1');
  });
});

describe('POST /roadmaps/:id/like', () => {
  it('increments likes', async () => {
    q.mockResolvedValue({ rows: [{ id: 'r1', likes: 11 }] });
    const res = await request(app).post(`${PREFIX}/r1/like`);
    expect(res.status).toBe(200);
    expect(res.body.data.likes).toBe(11);
  });
});

describe('POST /roadmaps/:id/progress', () => {
  it('requires auth', async () => {
    const res = await request(app).post(`${PREFIX}/r1/progress`).send({ node_id: 'n1', completed: true });
    expect(res.status).toBe(401);
  });

  it('saves progress with auth', async () => {
    q.mockResolvedValue({ rows: [{ id: 'prog1', node_id: 'n1', completed: true }] });
    const res = await request(app).post(`${PREFIX}/r1/progress`)
      .set(authHeader())
      .send({ node_id: 'n1', completed: true });
    expect(res.status).toBe(200);
  });
});
