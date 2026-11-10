/**
 * API client tests — verify the HTTP layer, base URL, and API helper shape.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { server } from './setup.js';
import { http, HttpResponse } from 'msw';

// We need to mock the http client since it's configured for a real URL
vi.mock('../src/api/client.js', () => {
  const mockGet  = vi.fn();
  const mockPost = vi.fn();
  const mockPatch = vi.fn();
  const mockDelete = vi.fn();
  const client = { get: mockGet, post: mockPost, patch: mockPatch, delete: mockDelete };
  return {
    default: client,
    setToken: vi.fn(),
    clearToken: vi.fn(),
  };
});

describe('API module shape', () => {
  it('jobCardsApi has expected methods', async () => {
    const { jobCardsApi } = await import('../src/api/index.js');
    expect(typeof jobCardsApi.list).toBe('function');
    expect(typeof jobCardsApi.get).toBe('function');
    expect(typeof jobCardsApi.suggest).toBe('function');
  });

  it('authApi has expected methods', async () => {
    const { authApi } = await import('../src/api/index.js');
    expect(typeof authApi.login).toBe('function');
    expect(typeof authApi.register).toBe('function');
    expect(typeof authApi.logout).toBe('function');
    expect(typeof authApi.me).toBe('function');
  });

  it('goalsApi has expected methods', async () => {
    const { goalsApi } = await import('../src/api/index.js');
    expect(typeof goalsApi.list).toBe('function');
    expect(typeof goalsApi.create).toBe('function');
    expect(typeof goalsApi.update).toBe('function');
    expect(typeof goalsApi.remove).toBe('function');
  });

  it('roadmapProgressApi has get and update methods', async () => {
    const { roadmapProgressApi } = await import('../src/api/index.js');
    expect(typeof roadmapProgressApi.get).toBe('function');
    expect(typeof roadmapProgressApi.update).toBe('function');
  });

  it('storiesApi has submit and like methods', async () => {
    const { storiesApi } = await import('../src/api/index.js');
    expect(typeof storiesApi.submitJourney).toBe('function');
    expect(typeof storiesApi.like).toBe('function');
  });
});

describe('roadmapProgressApi endpoints', () => {
  let http_client;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../src/api/client.js');
    http_client = mod.default;
  });

  it('get calls correct URL', async () => {
    const { roadmapProgressApi } = await import('../src/api/index.js');
    http_client.get.mockResolvedValue({ data: null });
    const slug = 'software-engineer--btech--online--internship';
    await roadmapProgressApi.get(slug);
    expect(http_client.get).toHaveBeenCalledWith(
      expect.stringContaining('roadmap-progress')
    );
  });

  it('update calls PATCH with correct URL', async () => {
    const { roadmapProgressApi } = await import('../src/api/index.js');
    http_client.patch.mockResolvedValue({ data: {} });
    const slug = 'software-engineer--btech--online--internship';
    await roadmapProgressApi.update(slug, { completed_steps: ['p0s0'] });
    expect(http_client.patch).toHaveBeenCalledWith(
      expect.stringContaining('roadmap-progress'),
      { completed_steps: ['p0s0'] }
    );
  });
});
