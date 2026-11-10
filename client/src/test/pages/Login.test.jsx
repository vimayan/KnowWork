import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../render-utils.jsx';
import Login from '../../views/Login.jsx';
import * as authStore from '../../store/authStore.js';

beforeEach(() => vi.clearAllMocks());

describe('Login page', () => {
  it('renders email and password fields', () => {
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ login: vi.fn(), loading: false });
    renderWithRouter(<Login />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('shows sign in button', () => {
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ login: vi.fn(), loading: false });
    renderWithRouter(<Login />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls login with form values on submit', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ ok: true });
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ login: mockLogin, loading: false });
    renderWithRouter(<Login />);

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' }));
  });

  it('shows demo credentials section', () => {
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ login: vi.fn(), loading: false });
    renderWithRouter(<Login />);
    expect(screen.getByText(/demo credentials/i)).toBeInTheDocument();
  });

  it('links to register page', () => {
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ login: vi.fn(), loading: false });
    renderWithRouter(<Login />);
    expect(screen.getByRole('link', { name: /create one free/i })).toBeInTheDocument();
  });
});
