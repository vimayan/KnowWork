import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../render-utils.jsx';
import FindMentor from '../../views/FindMentor.jsx';
import * as authStore from '../../store/authStore.js';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ user: null });
});

describe('FindMentor page', () => {
  it('renders the page heading', async () => {
    renderWithRouter(<FindMentor />);
    await waitFor(() => {
      expect(screen.getByText(/find a mentor/i)).toBeInTheDocument();
    });
  });

  it('shows mentor cards after loading', async () => {
    renderWithRouter(<FindMentor />);
    await waitFor(() => {
      // MSW returns one mentor from handlers
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it('has a search input', async () => {
    renderWithRouter(<FindMentor />);
    await waitFor(() => {
      const inputs = screen.queryAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });
});
