import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { authHeader } from './setup.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/salary';
beforeEach(() => vi.clearAllMocks());

const mockSalary = {
  id: 's1', job_card_id: 'jc1', currency: 'INR',
  p25: 600000, median: 900000, mean: 950000, p75: 1400000, p90: 2000000,
};

describe('GET /salary/:id', () => {
  it('returns salary data', async () => {
    q.mockResolvedValue({ rows: [mockSalary] });
    const res = await request(app).get(`${PREFIX}/jc1`);
    expect(res.status).toBe(200);
    expect(res.body.data.median).toBe(900000);
  });

  it('returns 404 for unknown id', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${PREFIX}/unknown-id`);
    expect(res.status).toBe(404);
  });
});

describe('GET /salary/:id/percentiles', () => {
  it('returns percentile data', async () => {
    q.mockResolvedValue({ rows: [mockSalary] });
    const res = await request(app).get(`${PREFIX}/jc1/percentiles`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('median');
  });
});

describe('GET /salary/:id/trend', () => {
  it('returns trend array', async () => {
    q.mockResolvedValue({ rows: [{ month: '2024-01', median: 850000 }] });
    const res = await request(app).get(`${PREFIX}/jc1/trend`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /salary/submit', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).post(`${PREFIX}/submit`).send({ job_card_id: 'jc1', salary: 1000000, currency: 'INR' });
    expect(res.status).toBe(401);
  });

  it('accepts submission with auth', async () => {
    q.mockResolvedValue({ rows: [{ id: 'sub1' }] });
    const res = await request(app).post(`${PREFIX}/submit`)
      .set(authHeader())
      .send({ job_card_id: 'jc1', salary: 1000000, currency: 'INR', years_experience: 3 });
    expect(res.status).toBe(200);
  });
});
