import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals:     true,
    environment: 'jsdom',
    setupFiles:  ['./tests/setup.js'],
    css:         false,
    coverage: {
      provider:  'v8',
      reporter:  ['text', 'lcov'],
      include:   ['src/**/*.{js,jsx}'],
      exclude:   ['src/lib/**', 'src/store/**', 'src/test/**'],
    },
  },
});
