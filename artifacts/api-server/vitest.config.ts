import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      // Only test-only constants here. DATABASE_URL must come from the ambient
      // environment: hardcoding it silently ignored the caller's target database
      // and made these integration tests unable to run inside the container.
      SESSION_SECRET: 'testsecret123456789',
    },
  },
});
