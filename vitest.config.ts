import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'client/src/components/ui/**',
        '**/*.d.ts',
        'vite.config.ts',
        'vitest.config.ts',
        'server/data/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}'
      ],
      include: [
        'client/src/**/*.{ts,tsx}',
        'server/**/*.{ts,js}',
        'shared/**/*.{ts,js}'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    include: ['tests/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache']
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
})