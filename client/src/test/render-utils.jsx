import { render } from '@testing-library/react';

// Next.js routing is mocked globally via vi.mock('next/navigation') in tests/setup.js.
// This wrapper exists for API compatibility with legacy test files that call renderWithRouter.
// The initialEntries option is accepted but ignored — routing state comes from the mock.
export function renderWithRouter(ui, { initialEntries: _ignored, ...opts } = {}) {
  return render(ui, opts);
}
