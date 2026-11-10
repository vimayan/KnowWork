import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/society';
beforeEach(() => vi.clearAllMocks());

describe('GET /society/:id', () => {
  it('returns society data for a job card', async () => {
    q.mockResolvedValue({
      rows: [{ id: 's1', job_card_id: 'jc1', income_mobility: 'medium', gender_ratio: '60:40' }],
    });
    const res = await request(app).get(`${PREFIX}/jc1`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('income_mobility');
  });

  it('returns 404 for unknown job card', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${PREFIX}/unknown`);
    expect(res.status).toBe(404);
  });
});
