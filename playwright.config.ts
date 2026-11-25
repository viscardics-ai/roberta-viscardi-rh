import { defineConfig } from '@playwright/test'

const port = 4177
export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.ts',
  use: {
    baseURL: 'http://127.0.0.1:' + port,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {},
  },
  webServer: { command: 'npm run dev -- --port ' + port + ' --strictPort', url: 'http://127.0.0.1:' + port, reuseExistingServer: !process.env.CI },
  reporter: 'list',
})
