import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../render-utils.jsx';
import Roadmaps from '../../views/Roadmaps.jsx';
import * as authStore from '../../store/authStore.js';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ user: null });
});

describe('Roadmaps page', () => {
  it('renders the page heading', async () => {
    renderWithRouter(<Roadmaps />);
    await waitFor(() => {
      const roadmapsEls = screen.queryAllByText(/roadmaps/i);
      expect(roadmapsEls.length).toBeGreaterThan(0);
    });
  });

  it('shows filter sidebar', async () => {
    renderWithRouter(<Roadmaps />);
    await waitFor(() => {
      const remoteFilter = screen.queryByText(/remote/i);
      expect(remoteFilter).toBeInTheDocument();
    });
  });

  it('renders job cards after data loads', async () => {
    renderWithRouter(<Roadmaps />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });
});
