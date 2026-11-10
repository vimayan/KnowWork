import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:3001/api/v1';

// ── Fixtures ──────────────────────────────────────────────────────────────────

export const fixtures = {
  user: { id: 'u1', name: 'Test User', email: 'test@example.com', role: 'user' },
  jobCard: {
    id: 'jc1', slug: 'software-engineer', title: 'Software Engineer',
    field_name: 'Technology', overview: 'Build software', is_remote_possible: true,
    is_freelance_viable: false, country: 'India',
  },
  profile: {
    id: 'p1', user_id: 'u1', display_name: 'Test User', headline: 'Developer',
    city: 'Mumbai', country: 'India',
    linkedin_url: null, github_url: null, portfolio_url: null,
    work_history: [], skills: [], learning_path: [],
  },
  mentor: {
    id: 'm1', display_name: 'Jane Mentor', headline: 'Engineering Lead',
    city: 'Bangalore', country: 'India', hourly_rate: 2000,
    avg_rating: 4.8, session_count: 42, is_available: true,
    areas_of_expertise: ['React', 'Node.js'],
  },
  roadmap: {
    id: 'r1', title: 'Become a Full Stack Dev', description: 'Step by step guide',
    job_card_id: 'jc1', likes: 120,
    nodes: [{ id: 'n1', title: 'Learn HTML', order: 1 }],
  },
  salary: {
    id: 's1', job_card_id: 'jc1', currency: 'INR',
    p25: 600000, median: 900000, mean: 950000, p75: 1400000, p90: 2000000,
  },
  story: {
    id: 'st1', title: 'From College to Google', from_background: 'B.Tech',
    to_role: 'Senior SWE', quote: 'Keep going.', timeframe: '3 years',
    likes: 55, views: 320, featured: false, status: 'published',
  },
};

// ── Handlers ──────────────────────────────────────────────────────────────────

export const handlers = [
  // AUTH
  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({ success: true, data: fixtures.user })),

  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({ success: true, data: { token: 'mock-jwt-token', user: fixtures.user } })),

  http.post(`${BASE}/auth/register`, () =>
    HttpResponse.json({ success: true, data: { token: 'mock-jwt-token', user: fixtures.user } }, { status: 201 })),

  http.post(`${BASE}/auth/logout`, () =>
    HttpResponse.json({ success: true, data: null })),

  // JOB CARDS
  http.get(`${BASE}/job-cards`, () =>
    HttpResponse.json({ success: true, data: [fixtures.jobCard], meta: { total: 1, page: 1, limit: 20 } })),

  http.get(`${BASE}/job-cards/:slug`, () =>
    HttpResponse.json({ success: true, data: fixtures.jobCard })),

  // SALARY
  http.get(`${BASE}/salary/:id`, () =>
    HttpResponse.json({ success: true, data: fixtures.salary })),

  http.get(`${BASE}/salary/:id/percentiles`, () =>
    HttpResponse.json({ success: true, data: fixtures.salary })),

  http.get(`${BASE}/salary/:id/trend`, () =>
    HttpResponse.json({ success: true, data: [{ month: '2024-01', median: 850000 }] })),

  http.get(`${BASE}/salary/compare`, () =>
    HttpResponse.json({ success: true, data: [fixtures.salary] })),

  // PROFILES
  http.get(`${BASE}/profiles/:id`, () =>
    HttpResponse.json({ success: true, data: fixtures.profile })),

  http.patch(`${BASE}/profiles/:id`, () =>
    HttpResponse.json({ success: true, data: fixtures.profile })),

  // TRAJECTORY
  http.get(`${BASE}/trajectory/:id/graph`, () =>
    HttpResponse.json({ success: true, data: { nodes: [], edges: [] } })),

  http.get(`${BASE}/trajectory/:id/compare`, () =>
    HttpResponse.json({ success: true, data: { paths: [] } })),

  // ROADMAPS
  http.get(`${BASE}/roadmaps`, () =>
    HttpResponse.json({ success: true, data: [fixtures.roadmap], meta: { total: 1, page: 1, limit: 20 } })),

  http.get(`${BASE}/roadmaps/:id`, () =>
    HttpResponse.json({ success: true, data: fixtures.roadmap })),

  http.post(`${BASE}/roadmaps/:id/like`, () =>
    HttpResponse.json({ success: true, data: { id: 'r1', likes: 121 } })),

  // MENTORS
  http.get(`${BASE}/mentors`, () =>
    HttpResponse.json({ success: true, data: [fixtures.mentor], meta: { total: 1, page: 1, limit: 20 } })),

  http.get(`${BASE}/mentors/:id`, () =>
    HttpResponse.json({ success: true, data: fixtures.mentor })),

  http.post(`${BASE}/mentors/:id/book`, () =>
    HttpResponse.json({ success: true, data: { id: 'sess1', status: 'pending' } }, { status: 201 })),

  // COMMUNITY
  http.get(`${BASE}/community`, () =>
    HttpResponse.json({ success: true, data: [] })),

  // SEARCH
  http.get(`${BASE}/search/job-cards`, () =>
    HttpResponse.json({ success: true, data: [fixtures.jobCard] })),

  // FEED
  http.get(`${BASE}/feed`, () =>
    HttpResponse.json({ success: true, data: [] })),

  http.get(`${BASE}/feed/trending`, () =>
    HttpResponse.json({ success: true, data: [] })),

  // STORIES
  http.get(`${BASE}/stories`, () =>
    HttpResponse.json({ success: true, data: [fixtures.story], meta: { total: 1 } })),

  http.post(`${BASE}/stories/journey`, () =>
    HttpResponse.json({ success: true, data: { id: 'st2', status: 'pending' } }, { status: 201 })),

  http.post(`${BASE}/stories/:id/like`, () =>
    HttpResponse.json({ success: true, data: { id: 'st1', likes: 56 } })),

  // EDUCATION
  http.get(`${BASE}/education/:id/subjects`, () =>
    HttpResponse.json({ success: true, data: [] })),
];
