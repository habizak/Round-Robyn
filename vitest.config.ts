import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      // Allows test files inside src/domain/__tests__/ to import via
      // `from '../src/domain/...'` as if they were at the project root level.
      '../src/domain': path.resolve(__dirname, 'src/domain'),
    },
  },
  test: {
    environment: 'node',
    include: ['TEST/**/*.ts', 'TEST/**/*.tsx'],
    exclude: ['**/node_modules/**', '**/.git/**', '**/.claude/**'],
  },
})
