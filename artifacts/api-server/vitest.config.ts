import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The suite is integration-style and the container runs its files in parallel,
    // so the 5s default produced false timeouts (observed: a test that takes 30ms
    // alone hitting 5s in a loaded worker). A genuine hang still fails here.
    testTimeout: 15_000,
    env: {
      // Only test-only constants here. DATABASE_URL must come from the ambient
      // environment: hardcoding it silently ignored the caller's target database
      // and made these integration tests unable to run inside the container.
      SESSION_SECRET: 'testsecret123456789',
    },
  },
});
