import { vi } from 'vitest';
import jwt from 'jsonwebtoken';

// ── DB mocks ─────────────────────────────────────────────────────────────────

vi.mock('../src/db/postgres.js', () => ({
  q:          vi.fn(),
  connectPg:  vi.fn(),
  default:    { query: vi.fn() },
}));

vi.mock('../src/db/redis.js', () => ({
  connectRedis:   vi.fn(),
  sessionGet:     vi.fn().mockResolvedValue(null),
  sessionSet:     vi.fn(),
  sessionDel:     vi.fn(),
  hasFieldAccess: vi.fn().mockResolvedValue(false),
  default:        { get: vi.fn(), set: vi.fn(), del: vi.fn() },
}));

vi.mock('../src/db/mongo.js', () => ({
  connectMongo: vi.fn(),
  default:      {},
}));

vi.mock('../src/db/elastic.js', () => ({
  connectElastic: vi.fn(),
  esClient:       { search: vi.fn().mockResolvedValue({ hits: { hits: [] } }) },
}));

vi.mock('../src/jobs/index.js', () => ({
  startJobs: vi.fn(),
}));

// ── Token helper ──────────────────────────────────────────────────────────────

const TEST_SECRET = 'test-secret-key';

// Override jwt.secret used by middleware
vi.mock('../src/config/index.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    config: {
      ...original.config,
      env:       'test',
      isProd:    false,
      isDev:     true,
      jwt:       { secret: TEST_SECRET, expiresIn: '1h', refreshExpiresIn: '7d' },
      apiVersion: 'v1',
      corsOrigins: ['http://localhost:5173'],
      rateLimit:  { windowMs: 900000, max: 1000, authMax: 100, uploadMax: 20 },
      upload:     { dir: '/tmp/uploads-test', maxMb: 10 },
    },
  };
});

export function createTestToken(payload = {}) {
  return jwt.sign(
    { id: 'test-user-id', email: 'test@example.com', role: 'user', name: 'Test User', ...payload },
    TEST_SECRET,
    { expiresIn: '1h' },
  );
}

export function authHeader(payload) {
  return { Authorization: `Bearer ${createTestToken(payload)}` };
}
