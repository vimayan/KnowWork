import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../render-utils.jsx';
import Compare from '../../views/Compare.jsx';
import * as authStore from '../../store/authStore.js';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ user: null });
});

describe('Compare page', () => {
  it('renders the compare heading', async () => {
    renderWithRouter(<Compare />);
    await waitFor(() => {
      const els = screen.queryAllByText(/compare/i);
      expect(els.length).toBeGreaterThan(0);
    });
  });

  it('shows role selection inputs', async () => {
    renderWithRouter(<Compare />);
    await waitFor(() => {
      const inputs = screen.queryAllByRole('combobox');
      const textboxes = screen.queryAllByRole('textbox');
      expect(inputs.length + textboxes.length).toBeGreaterThan(0);
    });
  });
});
