# Repository Architecture Audit (Task 0.2)

**Date:** 2026-08-13
**Author:** Jules (Engineering Agent)
**Status:** Audit Complete - Awaiting Architecture Review

## 1. Executive Summary
This document provides a comprehensive audit of the `amirreza4710/forooshyar` repository as mandated by Checkpoint DB-Verification-01 (Task 0.2). The purpose is to map the current state of the codebase, identify the operational stack, evaluate the architectural gaps against the Frozen MVP Domain Model, and propose a Target Structure and Migration Strategy without implementing any features or modifying database schemas.

## 2. Current Stack & Monorepo Structure
The repository is structured as a `pnpm` monorepo using Workspaces.
The current technological stack diverges from early markdown documentation (which referenced FastAPI/Python) but is robust and validated for Sprint 0. As formalized in **ADR-0001**, the codebase stack is the implementation authority.

**Operational Stack:**
*   **Package Manager:** `pnpm` (strictly enforced via `.npmrc` and `preinstall` scripts)
*   **Backend:** Express 5, JWT, Pino logger (Node.js/TypeScript)
*   **Frontend:** React 19, Vite 7, TypeScript, Tailwind CSS 4, shadcn/ui
*   **Database:** PostgreSQL 16
*   **ORM:** Drizzle ORM
*   **API Contract:** OpenAPI with Orval for React Query & Zod generation

## 3. Frontend Architecture (`artifacts/nadraan`)
*   **Framework:** React 19 via Vite.
*   **Styling:** Tailwind CSS 4 combined with Radix UI primitives (shadcn/ui).
*   **State & Data Fetching:** `@tanstack/react-query` utilizing generated clients from `@workspace/api-client-react`.
*   **Form Management:** `react-hook-form` with `@hookform/resolvers` and Zod validation.
*   **Structure:** Standard Vite project layout (`src/`, `public/`). Integrates with the monorepo workspace for API specs.

## 4. Backend Architecture (`artifacts/api-server`)
*   **Framework:** Express v5 with native Promise support.
*   **Security:** `jsonwebtoken` for auth, `bcryptjs` for password hashing, `cors`, `express-rate-limit`.
*   **Logging:** High-performance `pino` and `pino-http`.
*   **Structure:** Modular routes under `src/routes/`.
*   **Build:** Custom `build.mjs` using `esbuild`.

## 5. Database Architecture (`lib/db`)
*   **Engine:** PostgreSQL.
*   **Schema Location:** `lib/db/src/schema/`. Currently contains `users.ts`, `customers.ts`, `products.ts`, `orders.ts`.
*   **Connection:** Uses `pg` pool configured via `DATABASE_URL`.
*   **Design Patterns:** Uses `deletedAt` for Soft Deletes (as verified in recent PRs, though unverified on dev DB).

## 6. Drizzle ORM Setup
*   **Configuration:** `drizzle.config.ts` uses `drizzle-kit push` directly against the database URL.
*   **Workflow:** The project explicitly relies on `drizzle-kit push` (schema synchronization) rather than file-based migrations (no `drizzle/` migrations folder).
*   **Integrations:** Uses `drizzle-zod` for generating Zod schemas directly from the database schema definition.

## 7. Testing Infrastructure
*   **Framework:** `vitest` (v3).
*   **Integration Tests:** Uses `supertest` in the API server to hit Express endpoints (e.g., `src/routes/soft-delete.test.ts`).
*   **Test Data:** Test fixtures (`src/test/fixtures.ts`) generate prefixed test data (`TEST-...`) and clean up by ID after tests run, ensuring they can be run against a persistent database.

## 8. CI/CD & Automation
*   **Workflows:** Contains a `.github/workflows/docs.yml` (other workflows seem absent or minimal).
*   **Scripts:** The `scripts/` directory includes PowerShell scripts (`Backup-Database.ps1`, `Restore-Database.ps1`, `Initialize-Farakhorasan.ps1`, `Verify-Sprint0.ps1`) and a bash script for graph generation (`generate-graph.sh`).
*   **Deployment:** Configurations for Replit (`.replit`) and Docker Compose (`docker-compose.yml`) are present. Docker Compose defines `db`, `api`, and `web` services.

## 9. Architecture Gap Analysis (Current vs. Target Domain)
Based on the approved Domain Architecture (Sales, Product, Target, KPI, Commission, Collection, HR, Rule, Policy, Workflow, Approval, Notification, Identity, Analytics, Audit), the current codebase has significant gaps:
*   **Multitenancy:** The `organization_id` concept (mandated by ADR-0001) is currently missing from the DB schemas.
*   **Domain Boundaries:** The backend routes are currently CRUD-centric (`orders`, `products`, `customers`, `users`). They lack the distinct Application Services and Event Bus mechanisms needed for cross-domain communication (e.g., Order triggering Commission calculation).
*   **Rule Engine:** No infrastructure currently exists for the externalized Rule Engine.
*   **Audit Trail:** While `deletedAt` exists, a centralized `audit_trails` system (Append-only log) for all mutations is missing.
*   **Credit/Discount:** The `CreditProfile` and `Discount` logic are not yet modeled in the `customers` or `orders` schemas.
*   **Approvals:** Supervisor -> Admin approval workflows are absent.

## 10. Target Structure Recommendation
The current Monorepo layout (`artifacts/` for deployables, `lib/` for shared code) is solid and should be retained. We should introduce bounded contexts within the backend.

```text
amirreza4710/forooshyar
├── artifacts/
│   ├── api-server/         # Main Express app (API Gateway / Composition root)
│   │   ├── src/
│   │   │   ├── core/       # Error handling, Logging, Event Bus interfaces
│   │   │   ├── modules/    # Vertical Slices (Domain implementations)
│   │   │   │   ├── identity/
│   │   │   │   ├── master-data/ (Customer, Product)
│   │   │   │   ├── sales/ (Order, Approval)
│   │   │   │   ├── compensation/ (KPI, Target, Commission)
│   │   │   │   └── rules/ (Rule Engine client)
│   └── nadraan/            # React Frontend
├── lib/
│   ├── db/                 # Central DB Schema
│   │   ├── src/schema/     # (Split into domain files, e.g., sales.ts, identity.ts)
│   ├── api-zod/            # Shared validation contracts
│   └── api-client-react/   # Generated frontend clients
└── scripts/
```

## 11. Migration Strategy (Moving to Target Architecture)
We will follow the Vertical Slice strategy (Make Sales Operations Work) without a massive rewrite:

1.  **Foundation Update (Task 0.3):**
    *   Introduce `organization_id` to existing tables (Multitenancy).
    *   Implement centralized Audit logging utility.
    *   Setup the basic Event Bus (in-memory for MVP) in `core/`.
2.  **Customer Vertical Slice:**
    *   Split `customers` into `CustomerProfile`, `Location`, `Contact`, `CreditProfile`.
    *   Update API and UI for the enriched Customer model.
3.  **Product Vertical Slice:**
    *   Enrich products with base discounts/price lists.
4.  **Order Vertical Slice:**
    *   Refactor `orders` to use the Event Bus.
    *   Integrate `CreditValidation` (sync) during order creation.
5.  **Rule Engine Foundation:**
    *   Create the `rules` table and seed initial JSONB rules for commissions/discounts.
6.  **Commission & KPI:**
    *   Build the `Commission` domain, subscribing to Order events.
    *   Implement the Supervisor -> Admin approval endpoint.

**Note:** The current `drizzle-kit push` methodology is acceptable for the early MVP phase, but as the database scales to production with real data, we should migrate to `drizzle-kit generate` and `drizzle-kit migrate` for safer, versioned schema rollouts.
