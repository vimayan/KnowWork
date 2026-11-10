import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../render-utils.jsx';
import AiBeta from '../../views/AiBeta.jsx';
import * as authStore from '../../store/authStore.js';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ user: null });
});

describe('AiBeta page', () => {
  it('renders AI beta heading', async () => {
    renderWithRouter(<AiBeta />);
    await waitFor(() => {
      const headings = screen.queryAllByText(/ai|beta|career/i);
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  it('shows a chat input or prompt area', async () => {
    renderWithRouter(<AiBeta />);
    await waitFor(() => {
      const inputs = screen.queryAllByRole('textbox');
      const combos = screen.queryAllByRole('combobox');
      const buttons = screen.queryAllByRole('button');
      expect(inputs.length + combos.length + buttons.length).toBeGreaterThan(0);
    });
  });
});
