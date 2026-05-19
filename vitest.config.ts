import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react() as any],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    // Exclude Playwright e2e specs (they use @playwright/test, not Vitest)
    // Exclude live-infra integration tests (require real Supabase + Gemini API keys)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/e2e/**',
      'tests/integration/**',
      '**/*.integration.test.ts',
      '**/ingestionIntegration.test.ts',
    ],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
