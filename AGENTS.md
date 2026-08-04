# AGENTS.md

## Scope
These instructions apply to the entire repository.

## Source of Truth
All agents must use `docs/` as the primary source of product, business, UX, architecture, AI, and development truth.

Before starting work, read:
1. `PROJECT_STATE.md`
2. Relevant files under `docs/`
3. `README.md`

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
- Record significant architecture decisions in `docs/ADR/`.
- Update `PROJECT_STATE.md` when project phase, sprint, checkpoint, status, or next milestone changes.
- Do not introduce large batches of unrelated documents or code in a single commit.
- Prefer documentation-first changes before implementation when product behavior is not yet fixed.
