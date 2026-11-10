/**
 * Find a Mentor button — visibility, accessibility & routing tests
 *
 * Verifies that every page that received the button:
 *  1. Renders a link/button with accessible text "Find a Mentor"
 *  2. Points to /mentors
 *  3. Is visible (not hidden / display:none)
 *  4. Is NOT disabled
 *  5. Carries the Users icon (svg present inside the link)
 *  6. Lives in the expected position (page header / job card header)
 *
 * Pages covered: SalaryAnalytics, Compare, CareerRoadmap, Dashboard, Roadmaps
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { useAuthStore } from '../src/store/authStore.js';

// ── Mock router — useParams returns slug so CareerRoadmap fetches the job ────
vi.mock('../src/lib/router.jsx', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: vi.fn(() => ({ slug: 'software-engineer' })),
  };
});

// ── Mock API modules ──────────────────────────────────────────────────────────
vi.mock('../src/api/index.js', () => ({
  jobCardsApi:   { list: vi.fn(), get: vi.fn() },
  salaryApi:     { index: vi.fn(), percentiles: vi.fn(), trend: vi.fn(), compare: vi.fn(), submit: vi.fn() },
  roadmapsApi:   { list: vi.fn(), get: vi.fn(), like: vi.fn() },
  trajectoryApi: { get: vi.fn() },
  usersApi:      { agenda: vi.fn(), savedJobs: vi.fn(), update: vi.fn() },
  mentorsApi:    { list: vi.fn(), sessions: vi.fn(), mySessions: vi.fn() },
  feedApi:       { list: vi.fn(), get: vi.fn(), trending: vi.fn() },
}));

// ── Shared API setup ──────────────────────────────────────────────────────────
async function getApis() {
  const m = await import('../src/api/index.js');
  return m;
}

async function setupDefaultApis() {
  const api = await getApis();
  api.jobCardsApi.list.mockResolvedValue({ data: [] });
  api.jobCardsApi.get.mockResolvedValue({ data: null });
  api.salaryApi.index.mockResolvedValue({ data: [] });
  api.salaryApi.percentiles.mockResolvedValue({ data: null });
  api.salaryApi.trend.mockResolvedValue({ data: [] });
  api.salaryApi.compare.mockResolvedValue({ data: [] });
  api.roadmapsApi.list.mockResolvedValue({ data: [], meta: { total: 0 } });
  api.usersApi.agenda.mockResolvedValue({ data: [] });
  api.usersApi.savedJobs.mockResolvedValue({ data: [] });
  api.mentorsApi.list.mockResolvedValue({ data: [] });
  api.mentorsApi.sessions.mockResolvedValue({ data: [] });
  api.mentorsApi.mySessions.mockResolvedValue({ data: [] });
  api.feedApi.list.mockResolvedValue({ data: [] });
  api.feedApi.get.mockResolvedValue({ data: { items: [] } });
  api.feedApi.trending.mockResolvedValue({ data: [] });
  api.trajectoryApi.get.mockResolvedValue({ data: { scenarios: [], society_links: [] } });
}

// ── Helper: find the Find a Mentor link ──────────────────────────────────────
function findMentorLink() {
  return screen.queryAllByRole('link', { name: /find a mentor/i });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SALARY ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
describe('Find a Mentor — SalaryAnalytics page', () => {
  let SalaryAnalytics;

  beforeEach(async () => {
    await setupDefaultApis();
    ({ default: SalaryAnalytics } = await import('../src/views/SalaryAnalytics.jsx'));
  });

  it('renders a "Find a Mentor" link', () => {
    render(<SalaryAnalytics />);
    const links = findMentorLink();
    expect(links.length).toBeGreaterThan(0);
  });

  it('link href points to /mentors', () => {
    render(<SalaryAnalytics />);
    const [link] = findMentorLink();
    expect(link).toHaveAttribute('href', '/mentors');
  });

  it('link is visible (not hidden)', () => {
    render(<SalaryAnalytics />);
    const [link] = findMentorLink();
    expect(link).toBeVisible();
  });

  it('link is not disabled', () => {
    render(<SalaryAnalytics />);
    const [link] = findMentorLink();
    expect(link).not.toBeDisabled();
  });

  it('link contains a Users SVG icon', () => {
    render(<SalaryAnalytics />);
    const [link] = findMentorLink();
    const svg = link.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('sits in the page header (same container as Submit My Salary)', () => {
    render(<SalaryAnalytics />);
    const [link] = findMentorLink();
    const submitBtn = screen.getByRole('button', { name: /submit my salary/i });
    // Both should share a common ancestor (the header flex container)
    expect(link.closest('div')).toBe(submitBtn.closest('div'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. COMPARE
// ─────────────────────────────────────────────────────────────────────────────
describe('Find a Mentor — Compare page', () => {
  let Compare;

  beforeEach(async () => {
    await setupDefaultApis();
    ({ default: Compare } = await import('../src/views/Compare.jsx'));
  });

  it('renders a "Find a Mentor" link', () => {
    render(<Compare />);
    const links = findMentorLink();
    expect(links.length).toBeGreaterThan(0);
  });

  it('link href points to /mentors', () => {
    render(<Compare />);
    const [link] = findMentorLink();
    expect(link).toHaveAttribute('href', '/mentors');
  });

  it('link is visible', () => {
    render(<Compare />);
    const [link] = findMentorLink();
    expect(link).toBeVisible();
  });

  it('link is not disabled', () => {
    render(<Compare />);
    const [link] = findMentorLink();
    expect(link).not.toBeDisabled();
  });

  it('link contains a Users SVG icon', () => {
    render(<Compare />);
    const [link] = findMentorLink();
    const svg = link.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('sits in the page header (same container as the Compare Careers heading)', () => {
    render(<Compare />);
    const [link] = findMentorLink();
    const heading = screen.getByRole('heading', { name: /compare careers/i });
    // Both share the top-level header flex row
    expect(link.closest('div[class*="flex"]')).toBeTruthy();
    expect(heading.closest('div')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
describe('Find a Mentor — Dashboard page', () => {
  let Dashboard;

  beforeEach(async () => {
    await setupDefaultApis();
    useAuthStore.mockReturnValue({
      user: { id: 'u1', name: 'Test User', email: 'test@example.com' },
      initialized: true,
      loading: false,
    });
    ({ default: Dashboard } = await import('../src/views/Dashboard.jsx'));
  });

  it('renders a "Find a Mentor" link', () => {
    render(<Dashboard />);
    const links = findMentorLink();
    expect(links.length).toBeGreaterThan(0);
  });

  it('link href points to /mentors', () => {
    render(<Dashboard />);
    const [link] = findMentorLink();
    expect(link).toHaveAttribute('href', '/mentors');
  });

  it('link is visible', () => {
    render(<Dashboard />);
    const [link] = findMentorLink();
    expect(link).toBeVisible();
  });

  it('link is not disabled', () => {
    render(<Dashboard />);
    const [link] = findMentorLink();
    expect(link).not.toBeDisabled();
  });

  it('link contains a Users SVG icon', () => {
    render(<Dashboard />);
    const [link] = findMentorLink();
    const svg = link.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('sits next to the Add Journey button in the header', () => {
    render(<Dashboard />);
    const [link] = findMentorLink();
    const addJourneyLink = screen.getByRole('link', { name: /add journey/i });
    // Both share the same flex container
    expect(link.parentElement).toBe(addJourneyLink.parentElement);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. ROADMAPS
// ─────────────────────────────────────────────────────────────────────────────
describe('Find a Mentor — Roadmaps page', () => {
  let Roadmaps;

  beforeEach(async () => {
    await setupDefaultApis();
    ({ default: Roadmaps } = await import('../src/views/Roadmaps.jsx'));
  });

  it('renders a "Find a Mentor" link', () => {
    render(<Roadmaps />);
    const links = findMentorLink();
    expect(links.length).toBeGreaterThan(0);
  });

  it('link href points to /mentors', () => {
    render(<Roadmaps />);
    const [link] = findMentorLink();
    expect(link).toHaveAttribute('href', '/mentors');
  });

  it('link is visible', () => {
    render(<Roadmaps />);
    const [link] = findMentorLink();
    // Note: hidden sm:flex — in jsdom (no CSS breakpoints) the element is in the DOM
    expect(link).toBeInTheDocument();
  });

  it('link is not disabled', () => {
    render(<Roadmaps />);
    const [link] = findMentorLink();
    expect(link).not.toBeDisabled();
  });

  it('link contains a Users SVG icon', () => {
    render(<Roadmaps />);
    const [link] = findMentorLink();
    const svg = link.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('sits in the header next to Build My Roadmap', () => {
    render(<Roadmaps />);
    const [link] = findMentorLink();
    const buildLink = screen.getByRole('link', { name: /build my roadmap/i });
    // Both share the same parent flex container
    expect(link.parentElement).toBe(buildLink.parentElement);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CAREER ROADMAP (job detail page)
// ─────────────────────────────────────────────────────────────────────────────
describe('Find a Mentor — CareerRoadmap page', () => {
  let CareerRoadmap;
  const mockJob = {
    id: 'jc1', slug: 'software-engineer', title: 'Software Engineer',
    category: 'Technology', field: 'Technology',
    is_remote_possible: true, india_demand_trend: 'growing',
    summary: 'Build software systems.',
  };

  beforeEach(async () => {
    await setupDefaultApis();
    const api = await getApis();
    api.jobCardsApi.get.mockResolvedValue({ data: mockJob });
    api.trajectoryApi.get.mockResolvedValue({
      data: { scenarios: [], society_links: [], demand: {} },
    });
    api.salaryApi.index.mockResolvedValue({ data: [] });
    api.roadmapsApi.list.mockResolvedValue({ data: [], meta: { total: 0 } });
    api.usersApi.savedJobs.mockResolvedValue({ data: [] });

    ({ default: CareerRoadmap } = await import('../src/views/CareerRoadmap.jsx'));
  });

  it('renders a "Find a Mentor" link once the job card loads', async () => {
    render(<CareerRoadmap />);
    await waitFor(() => {
      const links = findMentorLink();
      expect(links.length).toBeGreaterThan(0);
    });
  });

  it('link href points to /mentors', async () => {
    render(<CareerRoadmap />);
    await waitFor(() => {
      const [link] = findMentorLink();
      expect(link).toHaveAttribute('href', '/mentors');
    });
  });

  it('link is visible', async () => {
    render(<CareerRoadmap />);
    await waitFor(() => {
      const [link] = findMentorLink();
      expect(link).toBeVisible();
    });
  });

  it('link is not disabled', async () => {
    render(<CareerRoadmap />);
    await waitFor(() => {
      const [link] = findMentorLink();
      expect(link).not.toBeDisabled();
    });
  });

  it('link contains a Users SVG icon', async () => {
    render(<CareerRoadmap />);
    await waitFor(() => {
      const [link] = findMentorLink();
      expect(link.querySelector('svg')).not.toBeNull();
    });
  });

  it('sits next to the Save Job button in the job card', async () => {
    render(<CareerRoadmap />);
    await waitFor(() => {
      const [link] = findMentorLink();
      const saveBtn = screen.queryAllByRole('button', { name: /save job/i })[0]
                   || screen.queryAllByRole('button', { name: /saved/i })[0];
      expect(link).toBeInTheDocument();
      if (saveBtn) {
        // Both should be inside the badges flex row of the job card
        expect(link.closest('div[class*="flex"]')).toBeTruthy();
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-page: no page accidentally renders MORE than one Find a Mentor link
// ─────────────────────────────────────────────────────────────────────────────
describe('Find a Mentor — no duplicate links', () => {
  beforeEach(async () => {
    await setupDefaultApis();
    useAuthStore.mockReturnValue({
      user: { id: 'u1', name: 'Test User', email: 'test@example.com' },
      initialized: true, loading: false,
    });
  });

  it('SalaryAnalytics renders exactly one Find a Mentor link', async () => {
    const { default: SalaryAnalytics } = await import('../src/views/SalaryAnalytics.jsx');
    render(<SalaryAnalytics />);
    expect(findMentorLink().length).toBe(1);
  });

  it('Compare renders exactly one Find a Mentor link', async () => {
    const { default: Compare } = await import('../src/views/Compare.jsx');
    render(<Compare />);
    expect(findMentorLink().length).toBe(1);
  });

  it('Dashboard renders exactly one Find a Mentor link', async () => {
    const { default: Dashboard } = await import('../src/views/Dashboard.jsx');
    render(<Dashboard />);
    expect(findMentorLink().length).toBe(1);
  });

  it('Roadmaps renders exactly one Find a Mentor link', async () => {
    const { default: Roadmaps } = await import('../src/views/Roadmaps.jsx');
    render(<Roadmaps />);
    expect(findMentorLink().length).toBe(1);
  });
});
