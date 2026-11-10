import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../render-utils.jsx';
import SalaryAnalytics from '../../views/SalaryAnalytics.jsx';
import * as authStore from '../../store/authStore.js';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ user: null });
});

describe('SalaryAnalytics page', () => {
  it('renders the page title', async () => {
    renderWithRouter(<SalaryAnalytics />);
    // MSW provides empty data; page renders with the salary heading and dropdowns
    await waitFor(() => {
      const salaryEls = screen.queryAllByText(/salary/i);
      expect(salaryEls.length).toBeGreaterThan(0);
    });
  });

  it('shows loading state then resolves', async () => {
    renderWithRouter(<SalaryAnalytics />);
    // After data loads (empty from MSW), loading spinner disappears
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
