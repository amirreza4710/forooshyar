# AGENTS.md

## Scope
These instructions apply to the entire repository.

## Source of Truth
All agents must use `docs/` as the primary source of product, business, UX, architecture, AI, and development truth.

Before starting work, follow this canonical reading order:
1. `PROJECT_STATE.md`
2. `AGENTS.md`
3. `README.md`
4. `docs/00_Project/governance-v2.4/README.md`
5. `docs/00_Project/Roadmap.md`
6. `docs/README.md`

## Stack Divergence Warning
The currently implemented repository stack is **React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, and OpenAPI**. Any historical or external references to FastAPI or Next.js are non-authoritative and must be ignored unless approved by a future Decision Record. No migration, merge, replacement, or stack substitution is approved at this time. All agents must treat the current repository implementation and current governance docs as authoritative. Any future stack change must go through a Decision Record and update `README.md`, `PROJECT_STATE.md`, `AGENTS.md`, `docs/README.md`, `Roadmap.md`, and relevant development docs together.

## Agent Roles

### Product Manager Agent
Owns product scope, milestones, acceptance criteria, and prioritization.

### Business Analyst Agent
Owns business rules, process definitions, constraints, and stakeholder requirements.

### UX Designer Agent
Owns user journeys, screen flows, interaction design, and usability requirements.

### System Architect Agent
Owns architecture decisions, boundaries, integration strategy, and ADR consistency.

### Backend Agent
Owns server-side implementation, APIs, domain services, validation, and persistence behavior.

### Frontend Agent
Owns client-side implementation, UI composition, state management, and frontend integration.

### QA Agent
Owns test strategy, regression checks, acceptance verification, and quality gates.

### DevOps Agent
Owns CI/CD, deployment, environment configuration, observability, and operational readiness.

### AI Architect Agent
Owns AI-assisted workflows, prompt architecture, agent boundaries, and AI governance.

## Working Rules
- Keep commits small, reversible, and documented.
- Before starting any new phase, sprint, checkpoint, or document, verify that the previous step is complete and consistent with its acceptance criteria.
- If the previous step is incomplete, conflicting, or unverified, stop forward progress and fix or document the gap first.
- Record significant architecture decisions in `docs/ADR/`.
- Update `PROJECT_STATE.md` when project phase, sprint, checkpoint, status, or next milestone changes.
- Do not introduce large batches of unrelated documents or code in a single commit.
- Prefer documentation-first changes before implementation when product behavior is not yet fixed.
