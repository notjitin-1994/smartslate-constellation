import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Load .env.local so the webServer process has Supabase credentials during E2E runs.
// dotenv won't override vars already set in the shell (CI will have these set directly).
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
} catch {
  // dotenv not available — env vars should already be in the shell
}

const hasSupabaseCredentials =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // run sequentially to share one dev server instance
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Only start the webServer if we have credentials. Without them, requests to the
  // Supabase middleware will crash. Run `npm run dev` manually first when credentials
  // are set, then re-run `npx playwright test`.
  ...(hasSupabaseCredentials
    ? {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      }
    : {}),
});
