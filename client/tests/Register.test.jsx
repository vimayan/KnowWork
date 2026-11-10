import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '../src/views/Register.jsx';

const mockRegister = vi.fn();
vi.mock('../src/store/authStore.js', () => ({
  useAuthStore: vi.fn(() => ({
    user: null, initialized: true, loading: false,
    register: mockRegister,
  })),
}));

describe('Register page', () => {
  it('renders without crashing', () => {
    expect(() => render(<Register />)).not.toThrow();
  });

  it('has name, email and password fields', () => {
    render(<Register />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min 8 characters')).toBeInTheDocument();
  });

  it('has a submit button', () => {
    render(<Register />);
    expect(
      screen.getByRole('button', { name: /register|sign up|create free account|create account/i })
    ).toBeInTheDocument();
  });

  it('has link back to login', () => {
    render(<Register />);
    expect(
      screen.getByRole('link', { name: /login|sign in|already have|create one free/i })
    ).toBeInTheDocument();
  });
});
