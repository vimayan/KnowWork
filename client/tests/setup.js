import '@testing-library/jest-dom';
import { vi, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// ── ResizeObserver stub (required by recharts in jsdom) ───────────────────────
global.ResizeObserver = class ResizeObserver {
  observe()    {}
  unobserve()  {}
  disconnect() {}
};

// ── Cleanup after each test ──────────────────────────────────────────────────
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ── Mock Next.js navigation ─────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname:     () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams:       () => ({}),
}));

vi.mock('next/link', () => ({
  default: ({ href, to, children, className, onClick, ...rest }) => {
    const { createElement } = require('react');
    return createElement('a', { href: href ?? to ?? '/', className, onClick, ...rest }, children);
  },
}));

// ── Mock react-hot-toast ─────────────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
  toast:   { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

// ── Mock auth store — default: guest user ────────────────────────────────────
vi.mock('../src/store/authStore.js', () => ({
  useAuthStore: vi.fn(() => ({ user: null, initialized: true, loading: false })),
}));

// ── Base URL used by the API client (relative URL in jsdom = http://localhost)
const API = 'http://localhost/api/v1';

// ── Default API responses (MSW) ─────────────────────────────────────────────
export const handlers = [
  // Job cards
  http.get(`${API}/job-cards`, () =>
    HttpResponse.json({ success: true, data: [], meta: { total: 0 } })),
  http.get(`${API}/job-cards/:slug`, () =>
    HttpResponse.json({ success: true, data: null }, { status: 404 })),
  http.post(`${API}/job-cards/suggest`, () =>
    HttpResponse.json({ success: true, data: { id: 'jc-new', slug: 'new-role', title: 'New Role', published: false, is_suggested: true } })),

  // Goals
  http.get(`${API}/users/me/goals`, () =>
    HttpResponse.json({ success: true, data: [] })),
  http.post(`${API}/users/me/goals`, () =>
    HttpResponse.json({ success: true, data: { id: 'g1', title: 'Test Goal' } })),

  // Roadmap progress
  http.get(`${API}/users/me/roadmap-progress/:slug`, () =>
    HttpResponse.json({ success: true, data: null })),
  http.patch(`${API}/users/me/roadmap-progress/:slug`, () =>
    HttpResponse.json({ success: true, data: { streak_days: 1, last_checkin_at: new Date().toISOString(), completed_steps: [] } })),

  // User endpoints
  http.get(`${API}/users/me/agenda`, () =>
    HttpResponse.json({ success: true, data: [] })),
  http.get(`${API}/users/me/saved-jobs`, () =>
    HttpResponse.json({ success: true, data: [] })),
  http.patch(`${API}/users/me`, () =>
    HttpResponse.json({ success: true, data: {} })),

  // Education
  http.get(`${API}/education/:id/degrees`, () =>
    HttpResponse.json({ success: true, data: [] })),

  // Stories / feed
  http.get(`${API}/stories`, () =>
    HttpResponse.json({ success: true, data: [] })),
  http.post(`${API}/stories`, () =>
    HttpResponse.json({ success: true, data: { id: 's1' } })),

  // Mentors
  http.get(`${API}/mentors`, () =>
    HttpResponse.json({ success: true, data: [] })),
  http.get(`${API}/mentors/sessions/mine`, () =>
    HttpResponse.json({ success: true, data: [] })),

  // Roadmaps community page
  http.get(`${API}/roadmaps`, () =>
    HttpResponse.json({ success: true, data: [], meta: { total: 0 } })),
  http.post(`${API}/roadmaps/:id/like`, () =>
    HttpResponse.json({ success: true, data: { likes: 1 } })),

  // Profiles
  http.get(`${API}/profiles/:id`, () =>
    HttpResponse.json({ success: true, data: null }, { status: 404 })),
  http.post(`${API}/profiles`, () =>
    HttpResponse.json({ success: true, data: { id: 'p1' } })),
  http.patch(`${API}/profiles/:id`, () =>
    HttpResponse.json({ success: true, data: {} })),

  // Salary
  http.get(`${API}/salary`, () =>
    HttpResponse.json({ success: true, data: [] })),
  http.get(`${API}/salary/compare`, () =>
    HttpResponse.json({ success: true, data: [] })),
  http.get(`${API}/salary/:id`, () =>
    HttpResponse.json({ success: true, data: [] })),
  http.get(`${API}/salary/:id/percentiles`, () =>
    HttpResponse.json({ success: true, data: null })),
  http.get(`${API}/salary/:id/trend`, () =>
    HttpResponse.json({ success: true, data: [] })),
  http.post(`${API}/salary`, () =>
    HttpResponse.json({ success: true, data: { id: 'sal1' } })),
  http.post(`${API}/salary/submit`, () =>
    HttpResponse.json({ success: true })),

  // Compare / trajectory
  http.get(`${API}/trajectory`, () =>
    HttpResponse.json({ success: true, data: { scenarios: [], society_links: [] } })),

  // Feed
  http.get(`${API}/feed`, () =>
    HttpResponse.json({ success: true, data: [] })),

  // Search
  http.get(`${API}/search`, () =>
    HttpResponse.json({ success: true, data: { results: [] } })),

  // Auth
  http.post(`${API}/auth/login`, () =>
    HttpResponse.json({ success: true, data: { token: 'tok', user: { id: 'u1', email: 'test@example.com' } } })),
  http.post(`${API}/auth/register`, () =>
    HttpResponse.json({ success: true, data: { token: 'tok', user: { id: 'u1', email: 'test@example.com' } } })),
  http.post(`${API}/auth/logout`, () =>
    HttpResponse.json({ success: true })),
  http.get(`${API}/auth/me`, () =>
    HttpResponse.json({ success: true, data: null }, { status: 401 })),
];

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Helpers ──────────────────────────────────────────────────────────────────
export function mockLoggedIn(user = { id: 'u1', name: 'Test User', email: 'test@example.com', role: 'user' }) {
  const { useAuthStore } = require('../src/store/authStore.js');
  useAuthStore.mockReturnValue({ user, initialized: true, loading: false });
}
