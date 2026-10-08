import { defineConfig } from 'vitest/config';
// Keep the default test command independent of MySQL and database resets.
export default defineConfig({ test: { include: ['tests/unit/**/*.test.ts'] } });
