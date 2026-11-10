import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { authHeader } from './setup.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/mentors';
beforeEach(() => vi.clearAllMocks());

const mockMentor = {
  id: 'm1', display_name: 'Jane Mentor', headline: 'Engineering Lead',
  city: 'Bangalore', hourly_rate: 2000, avg_rating: 4.8, is_available: true,
};

describe('GET /mentors', () => {
  it('returns mentor list', async () => {
    q.mockResolvedValueOnce({ rows: [mockMentor] })
     .mockResolvedValueOnce({ rows: [{ count: '1' }] });
    const res = await request(app).get(PREFIX);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('filters by expertise query param', async () => {
    q.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: '0' }] });
    const res = await request(app).get(`${PREFIX}?expertise=React`);
    expect(res.status).toBe(200);
  });
});

describe('GET /mentors/:id', () => {
  it('returns 404 for unknown id', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${PREFIX}/bad-id`);
    expect(res.status).toBe(404);
  });

  it('returns mentor profile', async () => {
    q.mockResolvedValueOnce({ rows: [mockMentor] })
     .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get(`${PREFIX}/m1`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('m1');
  });
});

describe('POST /mentors/:id/book', () => {
  it('requires auth', async () => {
    const res = await request(app).post(`${PREFIX}/m1/book`)
      .send({ scheduled_at: '2025-08-01T10:00:00Z', duration_minutes: 60 });
    expect(res.status).toBe(401);
  });

  it('books session with valid auth and data', async () => {
    q.mockResolvedValueOnce({ rows: [mockMentor] })
     .mockResolvedValueOnce({ rows: [{ id: 'sess1', status: 'pending' }] });
    const res = await request(app).post(`${PREFIX}/m1/book`)
      .set(authHeader())
      .send({ scheduled_at: '2025-08-01T10:00:00Z', duration_minutes: 60, topic: 'Career advice' });
    expect(res.status).toBe(201);
  });
});
