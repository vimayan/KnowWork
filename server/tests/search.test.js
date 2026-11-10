import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/search';
beforeEach(() => vi.clearAllMocks());

describe('GET /search/job-cards', () => {
  it('returns results for query', async () => {
    q.mockResolvedValue({ rows: [{ id: 'jc1', title: 'Software Engineer', slug: 'software-engineer' }] });
    const res = await request(app).get(`${PREFIX}/job-cards?q=software`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns empty for no query', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${PREFIX}/job-cards?q=`);
    expect(res.status).toBe(200);
  });
});

describe('GET /search/profiles', () => {
  it('returns profile results', async () => {
    q.mockResolvedValue({ rows: [{ id: 'p1', display_name: 'Alice', headline: 'Dev' }] });
    const res = await request(app).get(`${PREFIX}/profiles?q=alice`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
