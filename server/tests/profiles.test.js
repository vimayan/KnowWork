import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { authHeader } from './setup.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/profiles';
beforeEach(() => vi.clearAllMocks());

const mockProfile = {
  id: 'p1', user_id: 'u1', display_name: 'Test User',
  headline: 'Developer', city: 'Mumbai', country: 'India',
};

describe('GET /profiles', () => {
  it('returns profile list', async () => {
    q.mockResolvedValueOnce({ rows: [mockProfile] })
     .mockResolvedValueOnce({ rows: [{ count: '1' }] });
    const res = await request(app).get(PREFIX);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /profiles/:id', () => {
  it('returns profile with nested data', async () => {
    q.mockResolvedValueOnce({ rows: [mockProfile] })
     .mockResolvedValueOnce({ rows: [] })
     .mockResolvedValueOnce({ rows: [] })
     .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get(`${PREFIX}/p1`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('p1');
  });

  it('returns 404 for unknown profile', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${PREFIX}/unknown`);
    expect(res.status).toBe(404);
  });
});

describe('POST /profiles', () => {
  it('requires auth', async () => {
    const res = await request(app).post(PREFIX).send({ display_name: 'Test' });
    expect(res.status).toBe(401);
  });

  it('creates profile with auth', async () => {
    q.mockResolvedValue({ rows: [mockProfile] });
    const res = await request(app).post(PREFIX)
      .set(authHeader())
      .send({ display_name: 'Test User', headline: 'Developer' });
    expect(res.status).toBe(201);
  });
});

describe('PATCH /profiles/:id', () => {
  it('requires auth', async () => {
    const res = await request(app).patch(`${PREFIX}/p1`).send({ headline: 'Updated' });
    expect(res.status).toBe(401);
  });

  it('updates profile with auth', async () => {
    q.mockResolvedValueOnce({ rows: [mockProfile] })
     .mockResolvedValueOnce({ rows: [{ ...mockProfile, headline: 'Updated' }] })
     .mockResolvedValueOnce({ rows: [] })
     .mockResolvedValueOnce({ rows: [] })
     .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).patch(`${PREFIX}/p1`)
      .set(authHeader({ id: 'u1' }))
      .send({ headline: 'Updated' });
    expect(res.status).toBe(200);
  });
});
