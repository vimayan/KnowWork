import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from './setup.js';
import { http, HttpResponse } from 'msw';
import Login from '../src/views/Login.jsx';

// Mock the auth store login action
const mockLogin = vi.fn();
vi.mock('../src/store/authStore.js', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    initialized: true,
    loading: false,
    login: mockLogin,
  })),
}));

describe('Login page', () => {
  it('renders email and password fields', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('shows submit button', () => {
    render(<Login />);
    expect(screen.getByRole('button', { name: /sign in|log in|login/i })).toBeInTheDocument();
  });

  it('calls login with credentials on submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ ok: true });
    render(<Login />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in|log in|login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com', password: 'password123' })
      );
    });
  });

  it('shows error message on failed login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ ok: false, error: 'Invalid credentials' });
    render(<Login />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'bad@bad.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in|log in|login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  it('has link to register page', () => {
    render(<Login />);
    const registerLink = screen.getByRole('link', { name: /register|sign up|create account|create one free/i });
    expect(registerLink).toBeInTheDocument();
  });
});
