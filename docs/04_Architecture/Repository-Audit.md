# Repository Architecture Audit (Task 0.2)

**Date:** 2026-08-13  
**Author:** Jules (Engineering Agent)  
**Status:** Audit Complete — Governance Clarification Required Before Implementation

## 1. Executive Summary
This document provides a comprehensive audit of the `amirreza4710/forooshyar` repository as mandated by Checkpoint DB-Verification-01 (Task 0.2). The purpose is to map the current state of the codebase, identify the operational stack, evaluate the architectural gaps against the Frozen MVP Domain Model, and propose a Target Structure and Migration Strategy without implementing any features or modifying database schemas.

The audit remains valid as a repository baseline. The implementation recommendations below are now subject to the governance constraints in **ADR-0001** and **ADR-009**. In particular, multi-tenancy is a mandatory architectural concern, while platform-shell/بازاردان implementation is not an approved executable feature.

## 2. Current Stack & Monorepo Structure
The repository is structured as a `pnpm` monorepo using Workspaces.
The current technological stack diverges from early markdown documentation (which referenced FastAPI/Python) but is robust and validated for Sprint 0. As formalized in **ADR-0001**, the codebase stack is the implementation authority.

**Operational Stack:**
* **Package Manager:** `pnpm` (strictly enforced via `.npmrc` and `preinstall` scripts)
* **Backend:** Express 5, JWT, Pino logger (Node.js/TypeScript)
* **Frontend:** React 19, Vite 7, TypeScript, Tailwind CSS 4, shadcn/ui
* **Database:** PostgreSQL 16
* **ORM:** Drizzle ORM
* **API Contract:** OpenAPI with Orval for React Query & Zod generation

## 3. Frontend Architecture (`artifacts/nadraan`)
* **Framework:** React 19 via Vite.
* **Styling:** Tailwind CSS 4 combined with Radix UI primitives (shadcn/ui).
* **State & Data Fetching:** `@tanstack/react-query` utilizing generated clients from `@workspace/api-client-react`.
* **Form Management:** `react-hook-form` with `@hookform/resolvers` and Zod validation.
* **Structure:** Standard Vite project layout (`src/`, `public/`). Integrates with the monorepo workspace for API specs.

## 4. Backend Architecture (`artifacts/api-server`)
* **Framework:** Express v5 with native Promise support.
* **Security:** `jsonwebtoken` for auth, `bcryptjs` for password hashing, `cors`, `express-rate-limit`.
* **Logging:** High-performance `pino` and `pino-http`.
* **Structure:** Modular routes under `src/routes/`.
* **Build:** Custom `build.mjs` using `esbuild`.

## 5. Database Architecture (`lib/db`)
* **Engine:** PostgreSQL.
* **Schema Location:** `lib/db/src/schema/`. Currently contains `users.ts`, `customers.ts`, `products.ts`, `orders.ts`.
* **Connection:** Uses `pg` pool configured via `DATABASE_URL`.
* **Design Patterns:** Uses `deletedAt` for Soft Deletes (as verified in recent PRs, though unverified on dev DB).

## 6. Drizzle ORM Setup
* **Configuration:** `drizzle.config.ts` uses `drizzle-kit push` directly against the database URL.
* **Workflow:** The project explicitly relies on `drizzle-kit push` (schema synchronization) rather than file-based migrations (no `drizzle/` migrations folder).
* **Integrations:** Uses `drizzle-zod` for generating Zod schemas directly from the database schema definition.

## 7. Testing Infrastructure
* **Framework:** `vitest` (v3).
* **Integration Tests:** Uses `supertest` in the API server to hit Express endpoints (e.g., `src/routes/soft-delete.test.ts`).
* **Test Data:** Test fixtures (`src/test/fixtures.ts`) generate prefixed test data (`TEST-...`) and clean up by ID after tests run, ensuring they can be run against a persistent database.

## 8. CI/CD & Automation
* **Workflows:** Contains a `.github/workflows/docs.yml` (other workflows seem absent or minimal).
* **Scripts:** The `scripts/` directory includes PowerShell scripts (`Backup-Database.ps1`, `Restore-Database.ps1`, `Initialize-Farakhorasan.ps1`, `Verify-Sprint0.ps1`) and a bash script for graph generation (`generate-graph.sh`).
* **Deployment:** Configurations for Replit (`.replit`) and Docker Compose (`docker-compose.yml`) are present. Docker Compose defines `db`, `api`, and `web` services.

## 9. Architecture Gap Analysis (Current vs. Target Domain)
Based on the approved Domain Architecture (Sales, Product, Target, KPI, Commission, Collection, HR, Rule, Policy, Workflow, Approval, Notification, Identity, Analytics, Audit), the current codebase has significant gaps:
* **Multitenancy:** The `organization_id` concept is an **architectural requirement** and is currently missing from the DB schemas. This is a required implementation gap, but this audit does not authorize implementing it.
* **Domain Boundaries:** The backend routes are currently CRUD-centric (`orders`, `products`, `customers`, `users`). They lack the distinct Application Services and Event Bus mechanisms needed for cross-domain communication (e.g., Order triggering Commission calculation).
* **Rule Engine:** No infrastructure currently exists for the externalized Rule Engine.
* **Audit Trail:** While `deletedAt` exists, a centralized `audit_trails` system (Append-only log) for all mutations is missing.
* **Credit/Discount:** The `CreditProfile` and `Discount` logic are not yet modeled in the `customers` or `orders` schemas.
* **Approvals:** Supervisor -> Admin approval workflows are absent.

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
│   │   └── nadraan/            # React Frontend
├── lib/
│   ├── db/                 # Central DB Schema
│   │   ├── src/schema/     # (Split into domain files, e.g., sales.ts, identity.ts)
│   ├── api-zod/            # Shared validation contracts
│   └── api-client-react/   # Generated frontend clients
└── scripts/
```

## 11. Migration Strategy — Governance Gate
The original migration sequence remains a **target recommendation**, not an implementation authorization.

1. **Foundation Update:** Introduce mandatory organization scoping, centralized audit logging, and any required shared infrastructure only after the relevant ADR and Scope Review are accepted.
2. **Customer Vertical Slice:** Split `customers` into `CustomerProfile`, `Location`, `Contact`, `CreditProfile` only when the active MVP scope authorizes it.
3. **Product Vertical Slice:** Enrich products with base discounts/price lists only when admitted to the active scope.
4. **Order Vertical Slice:** Refactor `orders` to use approved domain/event boundaries and integrate `CreditValidation` when its feature scope is active.
5. **Rule Engine Foundation:** Create rules infrastructure only when the relevant MVP feature and ADR permit it.
6. **Commission & KPI:** Build the Commission domain and approval flow only within the approved phase/cut line.

**No item in this section authorizes schema, API, UI, dependency, or deployment changes in the current documentation-only governance PR.**

## 12. Platform / Module Boundary

Per **ADR-009**, the temporary canonical relationship is:

```text
Farakhorasan Platform
└── Forooshyar Sales module
```

The audit must therefore distinguish:

- platform-level organization/tenant infrastructure;
- Forooshyar Sales domain capabilities;
- future platform-shell concepts such as بازاردان.

`بازاردان` is not an executable feature in the current MVP and must not be implemented from this audit. Any implementation requires ADR + Scope Review first.

## 13. Product Naming / Legacy Branding

Until a final commercial/brand decision is made:

- **Farakhorasan Platform** is the temporary platform-level canonical name.
- **Forooshyar Sales** is the temporary canonical name for the sales module/product.
- Historical names such as «فروشیار» or «Farakhorasan Sales OS» may remain as legacy aliases in historical documents.
- Legacy branding must not silently become new code identifiers, routes, database identifiers, packages, or UI labels.

This is a documentation/governance decision only.

## 14. Implementation Gate

Before any agent starts implementation for multi-tenancy, platform shell, بازاردان, or any architecture-impacting change:

1. Required ADR must be accepted.
2. Scope Review must explicitly admit the work into the active scope.
3. Architecture impact and acceptance criteria must be recorded.
4. The work must belong to the single active Workstream.

This audit does not authorize implementation by itself.
