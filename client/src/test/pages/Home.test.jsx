import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../render-utils.jsx';
import Home from '../../views/Home.jsx';
import * as authStore from '../../store/authStore.js';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ user: null, initialized: true });
});

describe('Home page', () => {
  it('renders hero section', async () => {
    renderWithRouter(<Home />);
    await waitFor(() => {
      const heading = screen.queryByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });
  });

  it('shows call-to-action links', async () => {
    renderWithRouter(<Home />);
    await waitFor(() => {
      const links = screen.queryAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  it('shows KnowWork brand name', async () => {
    renderWithRouter(<Home />);
    await waitFor(() => {
      expect(screen.queryByText(/knowwork/i)).toBeInTheDocument();
    });
  });
});
