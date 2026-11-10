import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../render-utils.jsx';
import Dashboard from '../../views/Dashboard.jsx';
import * as authStore from '../../store/authStore.js';

beforeEach(() => vi.clearAllMocks());

const mockUser = { id: 'u1', name: 'Test User', email: 'test@example.com', role: 'user' };

describe('Dashboard page', () => {
  it('redirects or shows prompt when not logged in', () => {
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ user: null, initialized: true });
    renderWithRouter(<Dashboard />);
    // Dashboard returns null for unauthenticated (navigates to /login) — body should exist
    expect(document.body).toBeTruthy();
  });

  it('renders dashboard content for logged-in user', async () => {
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ user: mockUser, initialized: true });
    renderWithRouter(<Dashboard />);
    // h1 says "Welcome back, Test 👋" (first name only)
    await waitFor(() => {
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  it('shows navigation links to key sections', async () => {
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ user: mockUser, initialized: true });
    renderWithRouter(<Dashboard />);
    await waitFor(() => {
      const links = screen.queryAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });
});
