import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { authHeader } from './setup.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/employers';
beforeEach(() => vi.clearAllMocks());

const mockEmployer = { id: 'emp1', name: 'Infosys', city: 'Bangalore', avg_rating: 3.8 };

describe('GET /employers/:jobCardId', () => {
  it('returns employer list', async () => {
    q.mockResolvedValueOnce({ rows: [mockEmployer] })
     .mockResolvedValueOnce({ rows: [{ count: '1' }] });
    const res = await request(app).get(`${PREFIX}/jc1`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /employers/:jobCardId/:empId/reviews', () => {
  it('returns reviews for employer', async () => {
    q.mockResolvedValueOnce({ rows: [] })
     .mockResolvedValueOnce({ rows: [{ count: '0' }] });
    const res = await request(app).get(`${PREFIX}/jc1/emp1/reviews`);
    expect(res.status).toBe(200);
  });
});

describe('POST /employers/:jobCardId/:empId/reviews', () => {
  it('requires auth', async () => {
    const res = await request(app).post(`${PREFIX}/jc1/emp1/reviews`).send({ rating: 4 });
    expect(res.status).toBe(401);
  });

  it('submits review with auth', async () => {
    q.mockResolvedValue({ rows: [{ id: 'rev1', rating: 4 }] });
    const res = await request(app).post(`${PREFIX}/jc1/emp1/reviews`)
      .set(authHeader())
      .send({ rating: 4, review_text: 'Good company', work_life_balance: 4 });
    expect(res.status).toBe(201);
  });
});
