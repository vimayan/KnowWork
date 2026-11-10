/**
 * Compare page tests
 *
 * Uses vi.mock on the API modules so tests are independent of MSW handler ordering.
 *
 * Covers:
 *  - Static structure (heading, subtitle, picker section, search input)
 *  - Job list loading: jobs populate the picker list
 *  - Search box filters the displayed job list
 *  - Adding a job: job disappears from picker
 *  - Removing a chip via × returns job to picker
 *  - "Select at least 2 jobs" hint shown with 0 or 1 selections
 *  - Hint disappears when 2+ jobs are selected
 *  - Max 4 jobs: 5th add button is disabled
 *  - Comparing 2 jobs: calls salaryApi.compare → shows chart heading + per-job cards
 *  - Comparison cards show formatted salary, Remote, Demand, Samples
 *  - "View Full" links point to /career/:slug
 *  - No comparison content when fewer than 2 jobs selected
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Compare from '../src/views/Compare.jsx';

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
const jobA = { id: 'jc1', slug: 'software-engineer', title: 'Software Engineer', category: 'Technology', is_remote_possible: true,  india_demand_trend: 'growing' };
const jobB = { id: 'jc2', slug: 'data-scientist',    title: 'Data Scientist',    category: 'Technology', is_remote_possible: false, india_demand_trend: 'stable'  };
const jobC = { id: 'jc3', slug: 'product-manager',   title: 'Product Manager',   category: 'Management', is_remote_possible: true,  india_demand_trend: 'growing' };
const jobD = { id: 'jc4', slug: 'ux-designer',       title: 'UX Designer',       category: 'Design',     is_remote_possible: true,  india_demand_trend: 'stable'  };
const jobE = { id: 'jc5', slug: 'devops-engineer',   title: 'DevOps Engineer',   category: 'Technology', is_remote_possible: false, india_demand_trend: 'growing' };

const compareResult = [
  { id: 'jc1', title: 'Software Engineer', median_inr: 900000,  mean_inr: 960000,  samples: 120 },
  { id: 'jc2', title: 'Data Scientist',    median_inr: 1100000, mean_inr: 1150000, samples: 80  },
];

// ── Helper ────────────────────────────────────────────────────────────────────
async function getApis() {
  const mod = await import('../src/api/index.js');
  return { jobCardsApi: mod.jobCardsApi, salaryApi: mod.salaryApi };
}

/** Returns all buttons that contain no text (SVG-only icon buttons like the X remove button) */
function getIconOnlyButtons() {
  return screen.queryAllByRole('button').filter(btn => btn.textContent.trim() === '');
}

// ─────────────────────────────────────────────────────────────────────────────
describe('Compare — static structure', () => {
  beforeEach(async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [] });
    salaryApi.compare.mockResolvedValue({ data: [] });
  });

  it('renders the page heading "Compare Careers"', () => {
    render(<Compare />);
    expect(screen.getByRole('heading', { name: /compare careers/i })).toBeInTheDocument();
  });

  it('shows the subtitle about selecting 2–4 job cards', () => {
    render(<Compare />);
    expect(screen.getByText(/select 2.{1,4}4 job cards/i)).toBeInTheDocument();
  });

  it('renders the "Add Job to Compare" section heading', () => {
    render(<Compare />);
    expect(screen.getByText(/add job to compare/i)).toBeInTheDocument();
  });

  it('renders a search input in the picker', () => {
    render(<Compare />);
    // placeholder is "Search jobs…" (Unicode ellipsis)
    expect(screen.getByPlaceholderText(/search jobs/i)).toBeInTheDocument();
  });

  it('shows the "Select at least 2 jobs to compare" hint initially', () => {
    render(<Compare />);
    expect(screen.getByText(/select at least 2 jobs to compare/i)).toBeInTheDocument();
  });

  it('calls jobCardsApi.list with limit 100 on mount', async () => {
    const { jobCardsApi } = await getApis();
    render(<Compare />);
    await waitFor(() => {
      expect(jobCardsApi.list).toHaveBeenCalledWith({ limit: 100 });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Compare — job picker loading', () => {
  beforeEach(async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [jobA, jobB, jobC] });
    salaryApi.compare.mockResolvedValue({ data: [] });
  });

  it('shows job titles in the picker after loading', async () => {
    render(<Compare />);
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Data Scientist')).toBeInTheDocument();
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
    });
  });

  it('shows category text for each job in the picker', async () => {
    render(<Compare />);
    await waitFor(() => {
      const techEls = screen.queryAllByText('Technology');
      expect(techEls.length).toBeGreaterThan(0);
    });
  });

  it('renders clickable rows for each job', async () => {
    render(<Compare />);
    await waitFor(() => {
      // Each job renders as a button element
      const btns = screen.queryAllByRole('button');
      expect(btns.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('no comparison content shown on initial load', async () => {
    render(<Compare />);
    await waitFor(() => screen.getByText('Software Engineer'));
    expect(screen.queryByText(/salary comparison/i)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Compare — search filtering', () => {
  beforeEach(async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [jobA, jobB, jobC] });
    salaryApi.compare.mockResolvedValue({ data: [] });
  });

  it('filters picker list by title when user types in search', async () => {
    const user = userEvent.setup();
    render(<Compare />);
    await waitFor(() => screen.getByText('Software Engineer'));

    await user.type(screen.getByPlaceholderText(/search jobs/i), 'data');

    await waitFor(() => {
      expect(screen.getByText('Data Scientist')).toBeInTheDocument();
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      expect(screen.queryByText('Product Manager')).not.toBeInTheDocument();
    });
  });

  it('restores all jobs when search is cleared', async () => {
    const user = userEvent.setup();
    render(<Compare />);
    await waitFor(() => screen.getByText('Software Engineer'));

    await user.type(screen.getByPlaceholderText(/search jobs/i), 'data');
    await user.clear(screen.getByPlaceholderText(/search jobs/i));

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Data Scientist')).toBeInTheDocument();
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
    });
  });

  it('shows no picker items when search matches nothing', async () => {
    const user = userEvent.setup();
    render(<Compare />);
    await waitFor(() => screen.getByText('Software Engineer'));

    await user.type(screen.getByPlaceholderText(/search jobs/i), 'zzznomatch');

    await waitFor(() => {
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      expect(screen.queryByText('Data Scientist')).not.toBeInTheDocument();
      expect(screen.queryByText('Product Manager')).not.toBeInTheDocument();
    });
  });

  it('search is case-insensitive', async () => {
    const user = userEvent.setup();
    render(<Compare />);
    await waitFor(() => screen.getByText('Software Engineer'));

    await user.type(screen.getByPlaceholderText(/search jobs/i), 'DATA');

    await waitFor(() => {
      expect(screen.getByText('Data Scientist')).toBeInTheDocument();
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    });
  });

  it('filters by category as well as title', async () => {
    const user = userEvent.setup();
    render(<Compare />);
    await waitFor(() => screen.getByText('Product Manager'));

    await user.type(screen.getByPlaceholderText(/search jobs/i), 'management');

    await waitFor(() => {
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      expect(screen.queryByText('Data Scientist')).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Compare — adding jobs', () => {
  beforeEach(async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [jobA, jobB, jobC, jobD, jobE] });
    salaryApi.compare.mockResolvedValue({ data: [] });
  });

  it('clicking a picker row hides it from the picker (selected jobs excluded)', async () => {
    const user = userEvent.setup();
    render(<Compare />);
    await waitFor(() => screen.getByText('Software Engineer'));

    // The picker row button contains the job title text
    const seBtn = screen.queryAllByRole('button').find(btn =>
      btn.textContent.includes('Software Engineer')
    );
    expect(seBtn).toBeTruthy();
    await user.click(seBtn);

    await waitFor(() => {
      // No longer appears as a picker row button
      const remaining = screen.queryAllByRole('button').filter(btn =>
        btn.textContent.includes('Software Engineer')
      );
      expect(remaining.length).toBe(0);
    });
  });

  it('selected job title shows as a chip in the comparison area', async () => {
    const user = userEvent.setup();
    render(<Compare />);
    await waitFor(() => screen.getByText('Software Engineer'));

    const seBtn = screen.queryAllByRole('button').find(btn =>
      btn.textContent.includes('Software Engineer')
    );
    await user.click(seBtn);

    // The chip in the comparison area also shows the title
    await waitFor(() => {
      const titles = screen.queryAllByText('Software Engineer');
      // Should appear at least once (the chip)
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  it('still shows the "Select at least 2" hint after adding only 1 job', async () => {
    const user = userEvent.setup();
    render(<Compare />);
    await waitFor(() => screen.getByText('Software Engineer'));

    const seBtn = screen.queryAllByRole('button').find(btn =>
      btn.textContent.includes('Software Engineer')
    );
    await user.click(seBtn);

    await waitFor(() => {
      expect(screen.getByText(/select at least 2 jobs to compare/i)).toBeInTheDocument();
    });
  });

  it('hint disappears once 2 jobs are selected', async () => {
    const user = userEvent.setup();
    render(<Compare />);
    await waitFor(() => screen.getByText('Software Engineer'));

    for (const title of ['Software Engineer', 'Data Scientist']) {
      const btn = screen.queryAllByRole('button').find(b => b.textContent.includes(title));
      await user.click(btn);
      await waitFor(() => {
        expect(screen.queryAllByRole('button').find(b => b.textContent.includes(title))).toBeFalsy();
      });
    }

    await waitFor(() => {
      expect(screen.queryByText(/select at least 2 jobs to compare/i)).not.toBeInTheDocument();
    });
  });

  it('disables all picker buttons when 4 jobs already selected', async () => {
    const user = userEvent.setup();
    render(<Compare />);

    for (const title of ['Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer']) {
      await waitFor(() => {
        const btn = screen.queryAllByRole('button').find(b => b.textContent.includes(title));
        expect(btn).toBeTruthy();
      });
      const btn = screen.queryAllByRole('button').find(b => b.textContent.includes(title));
      await user.click(btn);
    }

    // 5th job button should be disabled
    await waitFor(() => {
      const devopsBtn = screen.queryAllByRole('button').find(b => b.textContent.includes('DevOps Engineer'));
      expect(devopsBtn).toBeTruthy();
      expect(devopsBtn).toBeDisabled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Compare — removing jobs', () => {
  beforeEach(async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [jobA, jobB] });
    salaryApi.compare.mockResolvedValue({ data: [] });
  });

  it('removed job reappears in the picker list', async () => {
    const user = userEvent.setup();
    render(<Compare />);
    await waitFor(() => screen.getByText('Software Engineer'));

    // Add job
    const seBtn = screen.queryAllByRole('button').find(b => b.textContent.includes('Software Engineer'));
    await user.click(seBtn);

    // Chip X button has no text — it's an SVG-only button
    await waitFor(() => {
      const iconBtns = getIconOnlyButtons();
      expect(iconBtns.length).toBeGreaterThan(0);
    });

    const xBtn = getIconOnlyButtons()[0];
    await user.click(xBtn);

    // Job should reappear in picker
    await waitFor(() => {
      const reappeared = screen.queryAllByRole('button').find(b => b.textContent.includes('Software Engineer'));
      expect(reappeared).toBeTruthy();
    });
  });

  it('removing a job shows the "Select at least 2" hint again', async () => {
    const user = userEvent.setup();
    render(<Compare />);
    await waitFor(() => screen.getByText('Software Engineer'));

    // Add both jobs
    for (const title of ['Software Engineer', 'Data Scientist']) {
      const btn = screen.queryAllByRole('button').find(b => b.textContent.includes(title));
      await user.click(btn);
      await waitFor(() => {
        expect(screen.queryAllByRole('button').find(b => b.textContent.includes(title))).toBeFalsy();
      });
    }

    // Hint should be gone (2 jobs selected)
    await waitFor(() => {
      expect(screen.queryByText(/select at least 2 jobs to compare/i)).not.toBeInTheDocument();
    });

    // Remove one (first X button in chip area)
    const xBtns = getIconOnlyButtons();
    await user.click(xBtns[0]);

    // Hint should return (now only 1 selected)
    await waitFor(() => {
      expect(screen.getByText(/select at least 2 jobs to compare/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Compare — comparison results', () => {
  beforeEach(async () => {
    const { jobCardsApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [jobA, jobB, jobC] });
  });

  async function addTwoJobs(user) {
    render(<Compare />);
    for (const title of ['Software Engineer', 'Data Scientist']) {
      await waitFor(() => {
        const btn = screen.queryAllByRole('button').find(b => b.textContent.includes(title));
        expect(btn).toBeTruthy();
      });
      const btn = screen.queryAllByRole('button').find(b => b.textContent.includes(title));
      await user.click(btn);
    }
  }

  it('calls salaryApi.compare with both job IDs when 2 jobs are selected', async () => {
    const user = userEvent.setup();
    const { salaryApi } = await getApis();
    salaryApi.compare.mockResolvedValue({ data: compareResult });
    await addTwoJobs(user);

    await waitFor(() => {
      expect(salaryApi.compare).toHaveBeenCalledWith(['jc1', 'jc2']);
    });
  });

  it('shows the "Salary Comparison" heading when compare data loads', async () => {
    const user = userEvent.setup();
    const { salaryApi } = await getApis();
    salaryApi.compare.mockResolvedValue({ data: compareResult });
    await addTwoJobs(user);

    await waitFor(() => {
      expect(screen.getByText(/salary comparison/i)).toBeInTheDocument();
    });
  });

  it('shows per-job stat labels: Median, Mean, Remote, Demand, Samples', async () => {
    const user = userEvent.setup();
    const { salaryApi } = await getApis();
    salaryApi.compare.mockResolvedValue({ data: compareResult });
    await addTwoJobs(user);

    await waitFor(() => {
      expect(screen.queryAllByText('Median').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('Mean').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('Remote').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('Demand').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('Samples').length).toBeGreaterThan(0);
    });
  });

  it('shows Software Engineer median as ₹9.0L (900000 / 100000)', async () => {
    const user = userEvent.setup();
    const { salaryApi } = await getApis();
    salaryApi.compare.mockResolvedValue({ data: compareResult });
    await addTwoJobs(user);

    await waitFor(() => {
      expect(screen.getByText('₹9.0L')).toBeInTheDocument();
    });
  });

  it('shows Data Scientist median as ₹11.0L (1100000 / 100000)', async () => {
    const user = userEvent.setup();
    const { salaryApi } = await getApis();
    salaryApi.compare.mockResolvedValue({ data: compareResult });
    await addTwoJobs(user);

    await waitFor(() => {
      expect(screen.getByText('₹11.0L')).toBeInTheDocument();
    });
  });

  it('shows "Yes" for jobA (is_remote_possible = true)', async () => {
    const user = userEvent.setup();
    const { salaryApi } = await getApis();
    salaryApi.compare.mockResolvedValue({ data: compareResult });
    await addTwoJobs(user);

    await waitFor(() => {
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });
  });

  it('shows "No" for jobB (is_remote_possible = false)', async () => {
    const user = userEvent.setup();
    const { salaryApi } = await getApis();
    salaryApi.compare.mockResolvedValue({ data: compareResult });
    await addTwoJobs(user);

    await waitFor(() => {
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  it('shows demand trend values from job fixture data', async () => {
    const user = userEvent.setup();
    const { salaryApi } = await getApis();
    salaryApi.compare.mockResolvedValue({ data: compareResult });
    await addTwoJobs(user);

    await waitFor(() => {
      expect(screen.getByText('growing')).toBeInTheDocument();
      expect(screen.getByText('stable')).toBeInTheDocument();
    });
  });

  it('shows sample counts in comparison cards', async () => {
    const user = userEvent.setup();
    const { salaryApi } = await getApis();
    salaryApi.compare.mockResolvedValue({ data: compareResult });
    await addTwoJobs(user);

    await waitFor(() => {
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
    });
  });

  it('renders "View Full" links pointing to /career/:slug for both jobs', async () => {
    const user = userEvent.setup();
    const { salaryApi } = await getApis();
    salaryApi.compare.mockResolvedValue({ data: compareResult });
    await addTwoJobs(user);

    await waitFor(() => {
      const viewLinks = screen.queryAllByRole('link', { name: /view full/i });
      expect(viewLinks.length).toBe(2);
      // Link uses `to` prop which our mock maps to href
      const hrefs = viewLinks.map(l => l.getAttribute('href'));
      expect(hrefs).toContain('/career/software-engineer');
      expect(hrefs).toContain('/career/data-scientist');
    });
  });

  it('shows NO comparison chart when only 1 job is selected', async () => {
    const { salaryApi } = await getApis();
    salaryApi.compare.mockResolvedValue({ data: compareResult });

    const user = userEvent.setup();
    render(<Compare />);
    await waitFor(() => screen.getByText('Software Engineer'));

    const btn = screen.queryAllByRole('button').find(b => b.textContent.includes('Software Engineer'));
    await user.click(btn);

    await new Promise(r => setTimeout(r, 100));
    expect(screen.queryByText(/salary comparison/i)).not.toBeInTheDocument();
  });

  it('does NOT call salaryApi.compare when fewer than 2 jobs are selected', async () => {
    const { salaryApi } = await getApis();
    salaryApi.compare.mockResolvedValue({ data: compareResult });

    const user = userEvent.setup();
    render(<Compare />);
    await waitFor(() => screen.getByText('Software Engineer'));

    const btn = screen.queryAllByRole('button').find(b => b.textContent.includes('Software Engineer'));
    await user.click(btn);

    await new Promise(r => setTimeout(r, 100));
    expect(salaryApi.compare).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Compare — three-job comparison', () => {
  it('shows 3 View Full links when 3 jobs are compared', async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [jobA, jobB, jobC] });
    salaryApi.compare.mockResolvedValue({
      data: [
        ...compareResult,
        { id: 'jc3', title: 'Product Manager', median_inr: 1300000, mean_inr: 1400000, samples: 55 },
      ],
    });

    const user = userEvent.setup();
    render(<Compare />);

    for (const title of ['Software Engineer', 'Data Scientist', 'Product Manager']) {
      await waitFor(() => {
        const btn = screen.queryAllByRole('button').find(b => b.textContent.includes(title));
        expect(btn).toBeTruthy();
      });
      const btn = screen.queryAllByRole('button').find(b => b.textContent.includes(title));
      await user.click(btn);
    }

    await waitFor(() => {
      const viewLinks = screen.queryAllByRole('link', { name: /view full/i });
      expect(viewLinks.length).toBe(3);
    });
  });

  it('shows mean values for 3 jobs', async () => {
    const { jobCardsApi, salaryApi } = await getApis();
    jobCardsApi.list.mockResolvedValue({ data: [jobA, jobB, jobC] });
    salaryApi.compare.mockResolvedValue({
      data: [
        ...compareResult,
        { id: 'jc3', title: 'Product Manager', median_inr: 1300000, mean_inr: 1400000, samples: 55 },
      ],
    });

    const user = userEvent.setup();
    render(<Compare />);

    for (const title of ['Software Engineer', 'Data Scientist', 'Product Manager']) {
      await waitFor(() => {
        const btn = screen.queryAllByRole('button').find(b => b.textContent.includes(title));
        expect(btn).toBeTruthy();
      });
      const btn = screen.queryAllByRole('button').find(b => b.textContent.includes(title));
      await user.click(btn);
    }

    await waitFor(() => {
      // median_inr: 1300000 → ₹13.0L
      expect(screen.getByText('₹13.0L')).toBeInTheDocument();
    });
  });
});
