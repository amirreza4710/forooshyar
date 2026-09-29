import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      SESSION_SECRET: 'testsecret123456789',
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/postgres'
    },
  },
});
