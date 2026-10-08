import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '../backend/.env.test', quiet: true });
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    channel: 'chrome',
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  webServer: [
    {
      command: 'node --import tsx scripts/e2e-server.ts',
      cwd: '../backend',
      url: 'http://127.0.0.1:4010/api/health',
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: 'npm run dev -- --port 5174',
      url: 'http://127.0.0.1:5174',
      env: { API_PROXY_TARGET: 'http://127.0.0.1:4010' },
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
