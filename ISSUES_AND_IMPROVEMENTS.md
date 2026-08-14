# Issues and Improvements Report
This document outlines the findings and potential improvements discovered after thoroughly reading and analyzing the existing codebase, CI/CD, foundation readiness scripts, and current architecture, without adding any new MVP features.

## 1. Missing Foundation Readiness Scripts
**Issue:** According to `PROJECT_STATE.md`, the Sprint 0 Target Verification process relies on executing a set of PowerShell scripts on a Windows + Docker Desktop target environment.
```powershell
.\scripts\Initialize-Farakhorasan.ps1
.\scripts\Backup-Database.ps1
.\scripts\Restore-Database.ps1
.\scripts\Verify-Sprint0.ps1
```
However, none of these PowerShell (`.ps1`) scripts exist in the repository (`scripts/` directory only contains `seed.ts`, `generate-graph.sh`, `post-merge.sh`, and `hello.ts`).

**Improvement:** Create the missing PowerShell scripts (`Initialize-Farakhorasan.ps1`, `Backup-Database.ps1`, `Restore-Database.ps1`, and `Verify-Sprint0.ps1`) to implement the frontend production build, Docker Compose run, database backup/restore flow, and verify the host health/readiness checks as defined in the "Remaining Gate Before Checkpoint 1.7 Freeze".

## 2. Unresolved Action Items in `PROJECT_STATUS.md`
**Issue:** There are multiple unchecked items on the Open Tasks list in `PROJECT_STATUS.md`:
- Confirming that `pnpm --filter @workspace/db push` has been run on the live dev database following PR #13 (Soft Delete).
- A small TypeScript bug in `artifacts/nadraan/src/pages/orders.tsx` (lines 118 & 287) — using `e.target.value` without casting to `OrderUpdateStatus`. In reality, the lines correspond to `171`, `191`, `196`, `214`, and `287`.
- Rate limiting for the `/auth/login` endpoint.
- Reviewing production logging levels.
- Re-creating Amirreza’s temporary GitHub token.

**Improvement:** Prioritize fixing the known small issues (e.g. cast the event value on line `287` of `orders.tsx` as `onChange={e => updateOrder.mutate({ id: o.id, data: { status: e.target.value as OrderUpdateStatus } })}`) and check off the open tasks to keep the project status up-to-date. Implement a basic rate-limiting middleware on the Express backend specifically for `/auth/login`.

## 3. TypeScript Type-Checking Errors
**Issue:** Running `pnpm run typecheck` across the monorepo fails.
- The `@workspace/nadraan` package fails to build because the output file `/app/lib/api-client-react/dist/index.d.ts` has not been built from source file `/app/lib/api-client-react/src/index.ts`. This indicates a missing dependency build step or missing build outputs in the `lib` before the `artifacts` are built.
- `scripts/src/seed.ts` fails to find type declarations for `bcryptjs`. While `bcryptjs` provides its own type declarations or needs `@types/bcryptjs`, the current version `2.4.3` in the `scripts` package does not bundle them correctly, or there's a conflict between type stubs.

**Improvement:**
- Fix `typecheck` commands to include a proper build step for library dependencies (like `api-client-react`) before checking the `artifacts` packages, or add `api-client-react` build target inside `typecheck:libs`.
- Ensure `@types/bcryptjs` or a correct `d.ts` file for `bcryptjs` is properly referenced so the `scripts` workspace compiles cleanly.

## 4. Unverified Status of `pnpm --filter @workspace/db push`
**Issue:** In `PROJECT_STATUS.md`, it states it's unclear if the soft delete migration has been applied.

**Improvement:** The maintainer needs to manually verify the migration status in the live Replit dev environment. Consider adding an automated check in the CI or application startup that verifies the database schema version or prints a warning if migrations are out-of-sync.

## 5. File `graphify-out` Committed Files
**Issue:** According to `CLAUDE.md`, after each merged PR/commit, only `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.html` should be committed, but other cache files might accidentally get in if not explicitly ignored. Currently, the `.gitignore` might be handling it, but it's important to monitor.

**Improvement:** Validate that `.gitignore` aggressively prevents committing `graphify-out/cache`, `.graphify_*`, `graph.json`, and `manifest.json`.

## 6. Docker and Compose Files Missing
**Issue:** The project state mentions verifying the "Docker Compose runtime verification" and "Backend tests inside container". However, there are no `Dockerfile` or `docker-compose.yml` files present in the root or artifacts directories.

**Improvement:** Create `Dockerfile` for the `api-server` and `nadraan` artifacts, and a root `docker-compose.yml` to orchestrate them alongside PostgreSQL. This is absolutely necessary to pass the remaining exit gate for Checkpoint 1.7.