import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { q } from '../src/db/postgres.js';

const PREFIX = '/api/v1/job-cards';

beforeEach(() => vi.clearAllMocks());

const mockCard = {
  id: 'jc1', slug: 'software-engineer', title: 'Software Engineer',
  field_name: 'Technology', overview: 'Build software',
};

describe('GET /job-cards', () => {
  it('returns list of job cards', async () => {
    q.mockResolvedValueOnce({ rows: [mockCard] })
     .mockResolvedValueOnce({ rows: [{ count: '1' }] });
    const res = await request(app).get(PREFIX);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('supports pagination params', async () => {
    q.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: '0' }] });
    const res = await request(app).get(`${PREFIX}?page=2&limit=5`);
    expect(res.status).toBe(200);
  });
});

describe('GET /job-cards/:slug', () => {
  it('returns 404 for unknown slug', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${PREFIX}/unknown-slug`);
    expect(res.status).toBe(404);
  });

  it('returns card for known slug', async () => {
    q.mockResolvedValue({ rows: [mockCard] });
    const res = await request(app).get(`${PREFIX}/software-engineer`);
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe('software-engineer');
  });
});
