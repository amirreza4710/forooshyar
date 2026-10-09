### Fixes

*   Restored deterministic "admin" / "admin" demo login functionality due to missing `.env` from Replit quota exhaustion.
*   Updated `dev-seed.ts` endpoint to create/update an "admin" user with "admin" password if environment variables are not provided, only for local development/demo environments.
*   Modified `login.tsx` to include "admin" in the demo user list and autofill the correct credentials.
*   Updated relevant API tests (`dev-seed.test.ts`) to expect this fallback behavior.

### Testing

*   **Ran API tests (`vitest`)**: `dev-seed.test.ts` and `auth.test.ts` pass successfully. Tests that depend on a live PostgreSQL instance could not be run because Docker/Postgres cannot be spun up reliably within the current unprivileged Jules environment, but deterministic application logic tests were covered.
