import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['node_modules/@hirez_io/observer-spy/dist/setup-auto-unsubscribe.js'],
    includeSource: ['libs/**/*.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*{.,-}test.{js,ts,jsx,tsx}',
        '**/*{.,-}spec.{js,ts,jsx,tsx}'
      ]
    }
  }
});