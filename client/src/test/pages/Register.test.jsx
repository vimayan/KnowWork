import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../render-utils.jsx';
import Register from '../../views/Register.jsx';
import * as authStore from '../../store/authStore.js';

beforeEach(() => vi.clearAllMocks());

describe('Register page', () => {
  it('renders name, email, and password fields', () => {
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ register: vi.fn(), loading: false });
    renderWithRouter(<Register />);
    expect(screen.getByPlaceholderText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('shows create account button', () => {
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ register: vi.fn(), loading: false });
    renderWithRouter(<Register />);
    expect(screen.getByRole('button', { name: /create free account/i })).toBeInTheDocument();
  });

  it('calls register with form values on submit', async () => {
    const mockRegister = vi.fn().mockResolvedValue({ ok: true });
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ register: mockRegister, loading: false });
    renderWithRouter(<Register />);

    await userEvent.type(screen.getByPlaceholderText('Ravi Kumar'), 'Alice');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText('Min 8 characters'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /create free account/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
  });

  it('links back to login', () => {
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue({ register: vi.fn(), loading: false });
    renderWithRouter(<Register />);
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });
});
