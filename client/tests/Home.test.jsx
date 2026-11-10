import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../src/views/Home.jsx';

describe('Home page', () => {
  it('renders without crashing', () => {
    expect(() => render(<Home />)).not.toThrow();
  });

  it('shows hero section headline', () => {
    render(<Home />);
    // The hero should have a prominent heading
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('has a CTA link to build-roadmap', () => {
    render(<Home />);
    const links = screen.getAllByRole('link');
    const hasBuildLink = links.some(l =>
      l.getAttribute('href')?.includes('build-roadmap') ||
      l.textContent?.toLowerCase().includes('roadmap') ||
      l.textContent?.toLowerCase().includes('start') ||
      l.textContent?.toLowerCase().includes('build')
    );
    expect(hasBuildLink).toBe(true);
  });
});
