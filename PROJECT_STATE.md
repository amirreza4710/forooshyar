# PROJECT_STATE.md

This file is the short-term memory of the repository. Every agent must read it before loading deeper context.

```yaml
Project Name: Farakhorasan Sales OS
Repository Mode: Documentation-first enterprise/open-source workflow
Current Phase: Core Business Documentation
Current Sprint: Sprint 1
Current Branch: work
Current Checkpoint: 1.0
Last Approved Document: Business Constitution v1.0
Last Completed Commit: docs(project): add Business Constitution v1.0
Next Document: Master Specification v2.0
Next Milestone: Sprint 1 Core Business Documents
Status: ACTIVE
```

## Current Objective
Establish the core business documentation layer before product requirements, workflows, domain models, and implementation plans are expanded.

## Sprint Sequence
1. Sprint 0 — repository bootstrap and governance files.
2. Sprint 1 — core business documents.
3. Sprint 2 — UX, screen, wireframe, interaction, and design system documents.
4. Sprint 3 — Figma, prompt library, AI agents, and architecture documents.
5. Sprint 4 — development, API, database, frontend, backend, and deployment documents.

## Immediate Next Step
Add `docs/00_Project/Master-Specification-v2.0.md` in a dedicated commit.

## Agent Loading Strategy
1. Read this file.
2. Read `AGENTS.md`.
3. Read only the relevant `docs/` folder for the active sprint.
4. Read implementation code only when the documentation does not answer the question.


## Stage Gate Rule
Before starting `Next Document`, the agent must verify that `Last Approved Document` exists, matches the expected sprint order, and has enough acceptance criteria for the next document to depend on it. If verification fails, do not move forward; update or repair the previous step first.

## Previous Step Verification
- Last verified step: Business Constitution v1.0
- Verification status: Complete enough to start Master Specification v2.0
- Required next verification: Confirm Master Specification v2.0 references Business Constitution v1.0 before PRD work starts.
