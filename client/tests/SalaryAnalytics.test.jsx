/**
 * SalaryAnalytics page tests
 *
 * Uses vi.mock on the API modules so tests are independent of MSW handler ordering.
 *
 * Covers:
 *  - Static structure (heading, subtitle, filters, submit button)
 *  - Job list loading: jobs populate the Job Card select dropdown
 *  - Auto-selects first job when no slug param, triggers salary load
 *  - Filter controls (zone, employer type, country, experience)
 *  - Loading spinner while salary data is in-flight
 *  - Empty state: no chart headings when data is empty
 *  - Populated state: bar chart heading, trend chart heading, salary matrix, percentile card
 *  - Unauthenticated submit button → toast error, no modal
 *  - Authenticated submit button → opens modal
 *  - Submit modal fields and cancel behaviour
 *  - Submit modal form calls the salary endpoint
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalaryAnalytics from '../src/views/SalaryAnalytics.jsx';
import { useAuthStore } from '../src/store/authStore.js';

// ── Mock API modules ──────────────────────────────────────────────────────────
vi.mock('../src/api/index.js', () => ({
  jobCardsApi: {
    list: vi.fn(),
    get:  vi.fn(),
  },
  salaryApi: {
    index:       vi.fn(),
    percentiles: vi.fn(),
    trend:       vi.fn(),
    compare:     vi.fn(),
    submit:      vi.fn(),
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockJob = {
  id: 'jc1', slug: 'software-engineer', title: 'Software Engineer',
  category: 'Technology', field: 'Technology',
};

const mockSalaryRow = {
  availability_zone: 'metro',
  employer_type:     'mnc',
  experience_min_yr:  0,
  experience_max_yr:  2,
  salary_min_inr:    600000,
  salary_median_inr: 900000,
  salary_max_inr:   1500000,
  demand_score:      7,
  sample_size:       42,
};

const mockPercentiles = {
  p25: 550000, median: 900000, mean: 960000, p75: 1400000, p90: 2100000,
  sample_count: 120,
};

const mockTrendRow = {
  month: '2024-01-01', avg_salary: 900000, data_points: 30,
};

// ── Shared API mock helpers ───────────────────────────────────────────────────
async function getApis() {
  const mod = await import('../src/api/index.js');
  return { jobCardsApi: mod.jobCardsApi, salaryApi: mod.salaryApi };
}

function setupEmptySalaryApis(salaryApi) {
  salaryApi.index.mockResolvedValue({ data: [] });
  salaryApi.percentiles.mockResolvedValue({ data: null });
  salaryApi.trend.mockResolvedValue({ data: [] });
}

function setupPopulatedSalaryApis(salaryApi) {
  salaryApi.index.mockResolvedValue({ data: [mockSalaryRow] });
  salaryApi.percentiles.mockResolvedValue({ data: mockPercentiles });
  salaryApi.trend.mockResolvedValue({ data: [mockTrendRow] });
}

// ─────────────────────────────────────────────────────────────────────────────
describe('SalaryAnalytics — static structure', () => {
  beforeEach(async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [] });
    setupEmptySalaryApis(salaryApi);
  });

  it('renders the page heading "Salary Analytics"', () => {
    render(<SalaryAnalytics />);
    const headings = screen.queryAllByText(/salary analytics/i);
    expect(headings.length).toBeGreaterThan(0);
  });

  it('shows the crowdsourced data subtitle', () => {
    render(<SalaryAnalytics />);
    expect(screen.getByText(/crowdsourced submissions/i)).toBeInTheDocument();
  });

  it('renders the Submit My Salary button', () => {
    render(<SalaryAnalytics />);
    expect(screen.getByRole('button', { name: /submit my salary/i })).toBeInTheDocument();
  });

  it('renders filter selects for Zone, Employer Type, Country', () => {
    render(<SalaryAnalytics />);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(3);
  });

  it('renders the experience range slider with min=0 max=20', () => {
    render(<SalaryAnalytics />);
    const slider = document.querySelector('input[type="range"]');
    expect(slider).not.toBeNull();
    expect(slider.getAttribute('min')).toBe('0');
    expect(slider.getAttribute('max')).toBe('20');
  });

  it('shows the Filters label', () => {
    render(<SalaryAnalytics />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('shows the experience value label (default 3yr)', () => {
    render(<SalaryAnalytics />);
    expect(screen.getByText(/experience.*3yr/i)).toBeInTheDocument();
  });

  it('zone select defaults to metro', () => {
    render(<SalaryAnalytics />);
    const selects = screen.getAllByRole('combobox');
    const zoneSelect = selects.find(s =>
      [...s.options].some(o => o.value === 'metro' || o.text === 'metro')
    );
    expect(zoneSelect).not.toBeUndefined();
    expect(zoneSelect.value).toBe('metro');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('SalaryAnalytics — job list loading', () => {
  it('populates the Job Card dropdown with loaded jobs', async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [mockJob] });
    setupEmptySalaryApis(salaryApi);

    render(<SalaryAnalytics />);

    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      const jobSelect = selects.find(s => s.textContent.includes('Software Engineer'));
      expect(jobSelect).not.toBeUndefined();
    });
  });

  it('shows a loading spinner while salary data is fetching', async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [mockJob] });
    // Delay salary response so the spinner has time to appear
    salaryApi.index.mockImplementation(() => new Promise(r => setTimeout(() => r({ data: [] }), 200)));
    salaryApi.percentiles.mockResolvedValue({ data: null });
    salaryApi.trend.mockResolvedValue({ data: [] });

    render(<SalaryAnalytics />);

    // Spinner component renders as <svg class="animate-spin ...">
    await waitFor(() => {
      const spinner = document.querySelector('svg.animate-spin');
      expect(spinner).not.toBeNull();
    }, { timeout: 1000 });
  });

  it('removes the spinner after salary data resolves', async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [mockJob] });
    setupEmptySalaryApis(salaryApi);

    render(<SalaryAnalytics />);

    await waitFor(() => {
      expect(document.querySelector('svg.lucide-loader-circle')).toBeNull();
    }, { timeout: 3000 });
  });

  it('does NOT call salary APIs when no job is selected', async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [] }); // empty list → selJob stays null
    setupEmptySalaryApis(salaryApi);

    render(<SalaryAnalytics />);

    // Give component time to settle
    await new Promise(r => setTimeout(r, 100));
    expect(salaryApi.index).not.toHaveBeenCalled();
  });

  it('calls jobCardsApi.list on mount', async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [] });
    setupEmptySalaryApis(salaryApi);

    render(<SalaryAnalytics />);

    await waitFor(() => {
      expect(jobCardsApi.list).toHaveBeenCalledWith({ limit: 100 });
    });
  });

  it('auto-selects the first job from the list when no slug', async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [mockJob] });
    setupEmptySalaryApis(salaryApi);

    render(<SalaryAnalytics />);

    await waitFor(() => {
      // selJob set → loadSalary called
      expect(salaryApi.index).toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('SalaryAnalytics — empty state', () => {
  beforeEach(async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [mockJob] });
    setupEmptySalaryApis(salaryApi);
  });

  it('does not show the salary bar chart heading', async () => {
    render(<SalaryAnalytics />);
    await waitFor(() => {
      expect(screen.queryByText(/salary range by type/i)).not.toBeInTheDocument();
    });
  });

  it('does not show the trend chart heading', async () => {
    render(<SalaryAnalytics />);
    await waitFor(() => {
      expect(screen.queryByText(/salary trend/i)).not.toBeInTheDocument();
    });
  });

  it('does not show the full salary matrix', async () => {
    render(<SalaryAnalytics />);
    await waitFor(() => {
      expect(screen.queryByText(/full salary matrix/i)).not.toBeInTheDocument();
    });
  });

  it('does not show the percentile card when perc is null', async () => {
    render(<SalaryAnalytics />);
    await waitFor(() => {
      expect(screen.queryByText('Percentiles')).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('SalaryAnalytics — populated state', () => {
  beforeEach(async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [mockJob] });
    setupPopulatedSalaryApis(salaryApi);
  });

  it('shows the salary bar chart heading when salary data loads', async () => {
    render(<SalaryAnalytics />);
    await waitFor(() => {
      expect(screen.getByText(/salary range by type/i)).toBeInTheDocument();
    });
  });

  it('shows the salary trend chart heading when trend data loads', async () => {
    render(<SalaryAnalytics />);
    await waitFor(() => {
      expect(screen.getByText(/salary trend/i)).toBeInTheDocument();
    });
  });

  it('shows the full salary matrix heading', async () => {
    render(<SalaryAnalytics />);
    await waitFor(() => {
      expect(screen.getByText(/full salary matrix/i)).toBeInTheDocument();
    });
  });

  it('shows salary matrix column headers', async () => {
    render(<SalaryAnalytics />);
    await waitFor(() => {
      // "Zone" appears in both the filter label and the table header — use queryAll
      expect(screen.queryAllByText('Zone').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryAllByText('Employer').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryAllByText('Min').length).toBeGreaterThanOrEqual(1);
      // "Median" appears in both the table header and the percentile card
      expect(screen.queryAllByText('Median').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryAllByText('Max').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders a salary row with mocked values', async () => {
    render(<SalaryAnalytics />);
    await waitFor(() => {
      // ₹9.0L appears in both the table row AND the percentile card (both use 900000)
      // Use queryAllByText to avoid "found multiple elements" error
      expect(screen.queryAllByText('₹9.0L').length).toBeGreaterThanOrEqual(1);
      // employer_type = 'mnc' — appears in table row
      expect(screen.queryAllByText('mnc').length).toBeGreaterThanOrEqual(1);
      // sample_size = 42 — unique in the table row
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  it('shows the Percentiles card with label rows', async () => {
    render(<SalaryAnalytics />);
    await waitFor(() => {
      expect(screen.getByText('P25')).toBeInTheDocument();
      expect(screen.getByText('Mean')).toBeInTheDocument();
      expect(screen.getByText('P75')).toBeInTheDocument();
      expect(screen.getByText('P90')).toBeInTheDocument();
    });
  });

  it('shows sample count in the percentile card', async () => {
    render(<SalaryAnalytics />);
    await waitFor(() => {
      expect(screen.getByText(/120 submissions/i)).toBeInTheDocument();
    });
  });

  it('shows P25 formatted as ₹5.5L', async () => {
    render(<SalaryAnalytics />);
    await waitFor(() => {
      // p25 = 550000 → ₹5.5L
      expect(screen.getByText('₹5.5L')).toBeInTheDocument();
    });
  });

  it('shows P90 formatted as ₹21.0L', async () => {
    render(<SalaryAnalytics />);
    await waitFor(() => {
      // p90 = 2100000 → ₹21.0L
      expect(screen.getByText('₹21.0L')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('SalaryAnalytics — filter interactions', () => {
  beforeEach(async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [mockJob] });
    setupEmptySalaryApis(salaryApi);
  });

  it('can change the Zone filter to tier1', async () => {
    const user = userEvent.setup();
    render(<SalaryAnalytics />);
    const selects = screen.getAllByRole('combobox');
    const zoneSelect = selects.find(s =>
      [...s.options].some(o => o.value === 'tier1')
    );
    expect(zoneSelect).not.toBeUndefined();
    await user.selectOptions(zoneSelect, 'tier1');
    expect(zoneSelect.value).toBe('tier1');
  });

  it('can change the Employer Type filter to startup', async () => {
    const user = userEvent.setup();
    render(<SalaryAnalytics />);
    const selects = screen.getAllByRole('combobox');
    const empSelect = selects.find(s =>
      [...s.options].some(o => o.value === 'startup')
    );
    expect(empSelect).not.toBeUndefined();
    await user.selectOptions(empSelect, 'startup');
    expect(empSelect.value).toBe('startup');
  });

  it('can change the Country filter to Global', async () => {
    const user = userEvent.setup();
    render(<SalaryAnalytics />);
    const selects = screen.getAllByRole('combobox');
    const countrySelect = selects.find(s =>
      [...s.options].some(o => o.value === 'Global')
    );
    expect(countrySelect).not.toBeUndefined();
    await user.selectOptions(countrySelect, 'Global');
    expect(countrySelect.value).toBe('Global');
  });

  it('experience slider starts at value 3', () => {
    render(<SalaryAnalytics />);
    const slider = document.querySelector('input[type="range"]');
    expect(slider.value).toBe('3');
  });

  it('zone change triggers a new salary API call', async () => {
    const user = userEvent.setup();
    const { salaryApi } = await getApis();
    render(<SalaryAnalytics />);

    // Wait for initial load
    await waitFor(() => expect(salaryApi.index).toHaveBeenCalled());
    const callsBefore = salaryApi.index.mock.calls.length;

    const selects = screen.getAllByRole('combobox');
    const zoneSelect = selects.find(s =>
      [...s.options].some(o => o.value === 'tier2')
    );
    if (zoneSelect) {
      await user.selectOptions(zoneSelect, 'tier2');
      await waitFor(() => {
        expect(salaryApi.index.mock.calls.length).toBeGreaterThan(callsBefore);
      });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('SalaryAnalytics — Submit My Salary', () => {
  beforeEach(async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [mockJob] });
    setupEmptySalaryApis(salaryApi);
  });

  it('shows a toast error when an unauthenticated user clicks Submit My Salary', async () => {
    const user = userEvent.setup();
    render(<SalaryAnalytics />);
    const toast = (await import('react-hot-toast')).default;
    await user.click(screen.getByRole('button', { name: /submit my salary/i }));
    expect(toast.error).toHaveBeenCalledWith('Please login to submit data');
  });

  it('does NOT open the modal for unauthenticated users', async () => {
    const user = userEvent.setup();
    render(<SalaryAnalytics />);
    await user.click(screen.getByRole('button', { name: /submit my salary/i }));
    expect(screen.queryByText(/submit your salary data/i)).not.toBeInTheDocument();
  });

  it('opens the submit modal for authenticated users', async () => {
    useAuthStore.mockReturnValue({ user: { id: 'u1', name: 'Test', email: 't@t.com' }, initialized: true, loading: false });
    const user = userEvent.setup();
    render(<SalaryAnalytics />);
    await user.click(screen.getByRole('button', { name: /submit my salary/i }));
    await waitFor(() => {
      expect(screen.getByText(/submit your salary data/i)).toBeInTheDocument();
    });
  });

  it('modal has job title, salary, employer type, experience, education inputs', async () => {
    useAuthStore.mockReturnValue({ user: { id: 'u1', name: 'Test', email: 't@t.com' }, initialized: true, loading: false });
    const user = userEvent.setup();
    render(<SalaryAnalytics />);
    await user.click(screen.getByRole('button', { name: /submit my salary/i }));
    await waitFor(() => screen.getByText(/submit your salary data/i));

    expect(screen.getByPlaceholderText('Your actual title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('1200000')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/B\.Tech CSE/i)).toBeInTheDocument();
  });

  it('Cancel button closes the modal', async () => {
    useAuthStore.mockReturnValue({ user: { id: 'u1', name: 'Test', email: 't@t.com' }, initialized: true, loading: false });
    const user = userEvent.setup();
    render(<SalaryAnalytics />);
    await user.click(screen.getByRole('button', { name: /submit my salary/i }));
    await waitFor(() => screen.getByText(/submit your salary data/i));

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByText(/submit your salary data/i)).not.toBeInTheDocument();
    });
  });

  it('submitting the form calls salaryApi.submit with correct data', async () => {
    useAuthStore.mockReturnValue({ user: { id: 'u1', name: 'Test', email: 't@t.com' }, initialized: true, loading: false });
    const { salaryApi } = await getApis();
    salaryApi.submit.mockResolvedValue({ success: true });

    // Wait for selJob to be set (first job selected) — need populated list
    const { jobCardsApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [mockJob] });

    const user = userEvent.setup();
    render(<SalaryAnalytics />);

    // Wait for job to load
    await waitFor(() => expect(salaryApi.index).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /submit my salary/i }));
    await waitFor(() => screen.getByText(/submit your salary data/i));

    await user.type(screen.getByPlaceholderText('Your actual title'), 'Backend Developer');
    await user.clear(screen.getByPlaceholderText('1200000'));
    await user.type(screen.getByPlaceholderText('1200000'), '1200000');

    await user.click(screen.getByRole('button', { name: /^submit$/i }));

    await waitFor(() => {
      expect(salaryApi.submit).toHaveBeenCalledWith(
        expect.objectContaining({ job_title: 'Backend Developer', salary_inr: 1200000 })
      );
    });
  });
});
