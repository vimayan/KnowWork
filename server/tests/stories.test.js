import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { authHeader } from './setup.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/stories';
beforeEach(() => vi.clearAllMocks());

const mockStory = {
  id: 'st1', title: 'From College to Google', status: 'published',
  from_background: 'B.Tech', to_role: 'SWE', likes: 55, views: 320,
};

describe('GET /stories', () => {
  it('returns published stories list', async () => {
    q.mockResolvedValueOnce({ rows: [mockStory] })
     .mockResolvedValueOnce({ rows: [{ count: '1' }] });
    const res = await request(app).get(PREFIX);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /stories/:id', () => {
  it('returns 404 for unknown story', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${PREFIX}/bad-id`);
    expect(res.status).toBe(404);
  });

  it('returns story and increments views', async () => {
    q.mockResolvedValueOnce({ rows: [mockStory] })
     .mockResolvedValueOnce({ rows: [] }); // view increment
    const res = await request(app).get(`${PREFIX}/st1`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('st1');
  });
});

describe('POST /stories/journey', () => {
  it('requires auth', async () => {
    const res = await request(app).post(`${PREFIX}/journey`)
      .send({ submitter_name: 'Test', current_title: 'Dev', steps: [{ title: 'Step 1' }] });
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app).post(`${PREFIX}/journey`)
      .set(authHeader())
      .send({ submitter_name: 'T' }); // too short, no steps
    expect(res.status).toBe(400);
  });

  it('submits journey and returns 201', async () => {
    q.mockResolvedValueOnce({ rows: [{ id: 'p1' }] }) // profile lookup
     .mockResolvedValueOnce({ rows: [{ id: 'st2', title: 'Test — Dev', status: 'pending', created_at: new Date() }] });
    const res = await request(app).post(`${PREFIX}/journey`)
      .set(authHeader())
      .send({
        submitter_name: 'Test User',
        current_title:  'Software Developer',
        steps: [{ title: 'First job', duration: '2 years', description: 'Worked hard', skills: 'React' }],
        key_learnings: ['Always keep learning'],
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
  });
});

describe('POST /stories/:id/like', () => {
  it('increments likes', async () => {
    q.mockResolvedValue({ rows: [{ id: 'st1', likes: 56 }] });
    const res = await request(app).post(`${PREFIX}/st1/like`);
    expect(res.status).toBe(200);
    expect(res.body.data.likes).toBe(56);
  });

  it('returns 404 for non-published story', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).post(`${PREFIX}/unpublished/like`);
    expect(res.status).toBe(404);
  });
});
