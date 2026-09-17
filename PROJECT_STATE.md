# Project State & Continuity

## Current Status
- **Phase:** Sprint 0 Target Environment Verification
- **State:** ACTIVE but BLOCKED (Unverified on Target Environment)
- **Official Checkpoint:** 1.6 — MVP Delivery Ready (FROZEN)
- **Next Checkpoint:** 1.7 — Engineering Foundation Ready (CANDIDATE)

## Architecture / Technical Context
The implemented and authoritative repository stack is **React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, and OpenAPI**. Historical references to FastAPI or Next.js are non-authoritative (per ADR-0001).

## Scope
- **Frozen MVP Backlog:** 11 Epics, 32 Features.
- **Explicitly Outside MVP:** Billing Engine, Message Broker, Partner Portal, Marketplace, Microservices, Autonomous AI Agents.

## Verification / Evidence
- **What changed:** Added Nginx frontend proxy, fixed docker-compose PORT, added tester stage to backend Dockerfile, refactored PowerShell verification scripts to dynamically assert all 8 gates.
- **Evidence:** See `docs/00_Project/governance-v2.4/SPRINT_0_VALIDATION_REPORT.md`
- **Remaining blockers:** Sandbox lacks overlayfs permissions required by Docker daemon. Cannot verify Compose-dependent gates.
- **Next action:** An engineer must run `.\scripts\Verify-Sprint0.ps1` on a Windows + Docker Desktop environment to generate final evidence. Checkpoint 1.7 cannot be frozen until this is complete.

## Requirements / Rules
- **Anti-Perfectionism:** Only one active workstream. New features are Post-MVP. Progress is measured by working software.
- **Agent Ownership:** Agents must read documentation in the canonical order and stick to the active workstream constraints.
- **Mandatory Next Action:** Target Environment Verification only. A1 development is not permitted until Checkpoint 1.7 is frozen.

## References
1. `PROJECT_STATE.md`
2. `AGENTS.md`
3. `README.md`
4. `docs/00_Project/governance-v2.4/README.md`
5. `docs/00_Project/Roadmap.md`
6. `docs/README.md`
