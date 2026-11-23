# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Added
- **Phase A1 Operational Foundation Completion & Freeze:**
  - Resolved and verified all 3 open decisions (D1 Basic Settings, D2 Self-service Password Change, D3 Audit Enabler).
  - Hardened `POST /api/auth/change-password` route with identical-password rejection, active refresh token revocation, transactional audit logging, and Persian error messaging.
  - Added unit test in `src/routes/auth.test.ts` verifying rejection (400) when new password matches current password.
  - Verified dynamic prefix resolution from `settingsTable` (`productCodePrefix`, `customerCodePrefix`, `orderCodePrefix`) in product, customer, and order creation transactions.
  - Updated and approved `docs/01_PRD/A1-Acceptance-Criteria.md` as 100% passed and frozen.

### Added
- **TASK-003: Hydra Agent Communication Protocol (ACP) Contracts:**
  - Defined strict TypeScript 5.x contracts and Zod validation schemas in `@workspace/api-zod` (`lib/api-zod/src/hydra-acp.contract.ts`).
  - Implemented discriminated union protocol events (`HYDRA_INTENT_PROPOSED`, `HYDRA_DEBATE_ROUND_COMPLETED`, `HYDRA_EXECUTION_DECIDED`).
  - Enforced 2-round Senate debate cap invariant (`HYDRA_MAX_DEBATE_ROUNDS = 2`) and deterministic multi-tenant headers.
  - Added 13 Vitest unit tests covering envelopes, headers, debate rounds, receipts, and event schemas (`lib/api-zod/src/hydra-acp.contract.test.ts` - 100% pass).
  - Added `./hydra-acp` subpath export in `lib/api-zod/package.json` and root re-export in `lib/api-zod/src/index.ts`.
  - Added `HANDOVER.md` documentation detailing verification steps and contract signatures.

### Fixed
- **Typecheck & Monorepo Code Health (Zero-Error Baseline):**
  - Resolved TypeScript error TS2339 in `artifacts/api-server/src/routes/auth.ts` by aligning Zod error handling to `pwParsed.error.issues[0]?.message`.
  - Removed dangling table cells referencing undefined variable `o` inside the skeleton loading row in `artifacts/nadraan/src/pages/orders.tsx`.
  - Confirmed 100% clean typecheck (`pnpm run typecheck`) across all workspaces (`@workspace/api-server`, `@workspace/nadraan`, `@workspace/scripts`, and `lib/`).
- **CI Test Suite & Agent Boundary Compliance:**
  - Reverted `.github/workflows/docs.yml` to adhere strictly to `agent-microtask-gate` scope boundaries (which bans modifying `.github/` files).
  - Fixed `customFetch` in `@workspace/api-client-react` to guard demo-mock fallbacks behind `isDemo`, ensuring HTTP error statuses properly throw `ApiError`.
  - Aligned `dashboard.test.ts` in `@workspace/api-server` to mock Drizzle `db.select` instead of obsolete `db.execute`.
  - Added `localStorage` stub in `auth.test.ts` for Node 22 testing compatibility.
  - Added `PyYAML>=6.0` to `requirements.txt` to satisfy Python test suite dependencies (`test_docker_empirical.py`) in CI.

### Known issues
- The API test suite is intermittently flaky **inside the container** (roughly 3 in 10 runs): a test fails with `Test timed out` or `Hook timed out`, never with an assertion error, and the affected test moves between runs. The host and CI (which runs the suite on the runner against a service container) have been stable across 9 consecutive runs. Tracked as `OPEN-1` in `PROJECT_STATE.md`; only Sprint 0 gate 3 is affected.
- `artifacts/api-server/src/routes/orders.test.ts` and `soft-delete.test.ts` used to call `pool.end()` in `afterAll` on the module-level pool shared by every test file in a worker; that was removed.

- Closed the same code-generation defect on orders that was fixed for products and customers: `code` now derives from the row's own id (`ORD-` + `9000 + id`) inside the create transaction and is unique in the schema. The previous `9000 + count + 1` generator handed an already-used code to the next order after a hard delete, and two concurrent creates could race onto the same value; `orders.code` had no uniqueness constraint at all.
- `GET /api/notifications` answered `200` to anonymous callers, exposing customer names, order codes and totals, and `/api/notifications/stream` accepted the access token from `?token=`, which puts a live token in URLs, browser history and the nginx access log. Both endpoints now require `Authorization: Bearer`, and the notification bell reads the stream from a `fetch` response instead of `EventSource` so it can send that header.
- Fixed the API container crash. The runner stage copied `dist/` to `/app`, but `esbuild-plugin-pino` bakes absolute worker paths at build time; the logger then died with `MODULE_NOT_FOUND`. This path mismatch was the only cause of the startup crash — the `express-rate-limit` IPv6 validation is logged, not thrown.
- Hardened the login rate limiter to derive its key through `ipKeyGenerator` (independent security fix): a raw `req.ip` key let one IPv6 client rotate addresses within its own /64 to bypass the 5-attempts-per-15-minutes limit.
- Added `trust proxy = 1` to the API and `X-Real-IP` / `X-Forwarded-For` forwarding in the web container's nginx, so rate limiting and audit logs see the real caller instead of the proxy container.
- Removed the non-linux native-package overrides from `pnpm-workspace.yaml`; they left the declared target environment (Windows + Docker Desktop) unable to build or test the frontend at all. Committed `.dockerignore`, which was untracked and therefore missing from fresh-clone builds.
- Fixed `artifacts/api-server/vitest.config.ts`, which hardcoded `DATABASE_URL` and silently overrode the caller's database, making the integration suite impossible to run inside a container.
- Fixed `drizzle-kit push` on Windows, where the schema path is matched as a glob and a backslash is an escape character.
- Removed the duplicate `POST /dev/seed-admin` route and the credentials committed in the repository; `SESSION_SECRET` and `SEED_ADMIN_PASSWORD` are now required and `docker compose` fails fast without them. The previously committed password must be treated as compromised and rotated.
- Made the Sprint 0 verification script verify what it claims: `GATE-1.7-03` now runs the container test suite instead of only building the image, secrets come from `.env`, and password rotation asserts that the old password is rejected.
- Added a workspace-root `pnpm run test` and made PR validation real: CI provisions PostgreSQL, pushes the schema and runs the tests explicitly instead of passing with "No test script found".
- Added regression tests for the dev-seed route and the rate-limiter key derivation.
- Renamed the approved product to Forooshyar Plus / فروشیار پلاس; Bazarak is now the source label for integrated Field Operations and Automation capabilities.
- Added ADR-011 and renamed the canonical integration PRD without changing technical identifiers or the Git remote.
- feat(ci): add PR validation and verified baseline architecture documentation
- Added Master Specification v2.0 as the canonical navigation and traceability hub.
- Added a validation-first roadmap centered on the 30-day Paid Design Partner Pilot.
- Added accepted ADR-006 for Pricing & Revenue Architecture.
- Added accepted ADR-007 for the Partner Commercial Model.
- Added accepted ADR-008 for Event-Informed and Ledger-Based Billing.
- Extended the Business Constitution with pricing, partner, billing, feature-admission, and AI-cost governance.
- Kept Billing Engine, Subscription Management, Partner Portal, automated invoicing, and automated payouts outside the MVP.
- Added a stage-gate rule requiring previous-step verification before continuing to the next document or sprint.
- Added Business Constitution v1.0 as the first Sprint 1 core business document.
- Initialized repository documentation structure for Farakhorasan Sales OS.
