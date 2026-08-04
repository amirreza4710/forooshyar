# PROJECT_STATE.md

This file is the short-term memory of the repository. Every agent must read it before loading deeper context.

    Project Name: Farakhorasan Sales OS
    Repository Mode: Documentation-first enterprise/open-source workflow
    Current Phase: Core Business Documentation
    Current Sprint: Sprint 1
    Current Branch: agent/pricing-constitution-master-spec
    Current Checkpoint: 1.1
    Last Approved Document: Business Constitution v1.0 baseline
    Current Review: Pricing Constitution amendments, ADR-006 to ADR-008, Master Specification v2.0, and Roadmap draft
    Last Completed Commit: docs(project): add Master Specification v2.0
    Next Gate: Review and approve Master Specification v2.0
    Next Document after Gate: PRD
    Next Milestone: Sprint 1 Core Business Documents
    Status: IN REVIEW

## Current Objective

Review the commercial constitution amendments and use Master Specification v2.0 as the canonical navigation and traceability hub before expanding product requirements.

## Current Decisions

- ADR-006 — Pricing & Revenue Architecture — Accepted
- ADR-007 — Partner Commercial Model — Accepted
- ADR-008 — Event-Informed and Ledger-Based Billing — Accepted
- Overall Business Constitution status remains Draft for Sprint 1 review.
- Billing Engine, Subscription Management, Partner Portal, automated invoicing, and automated payouts remain outside the 30-day MVP.

## Sprint Sequence

1. Sprint 0 — repository bootstrap and governance files.
2. Sprint 1 — core business documents.
3. Sprint 2 — UX, screen, wireframe, interaction, and design system documents.
4. Sprint 3 — Figma, prompt library, AI agents, and architecture documents.
5. Sprint 4 — development, API, database, frontend, backend, and deployment documents.

## Immediate Next Step

Review the draft PR for consistency. After merge, explicitly approve or revise Master Specification v2.0 before PRD work starts.

## Agent Loading Strategy

1. Read this file.
2. Read AGENTS.md.
3. Read docs/02_Business/Business-Constitution-v1.0.md.
4. Read docs/00_Project/Master-Specification-v2.0.md.
5. Read only the canonical detail documents relevant to the task.
6. Read implementation code only when documentation does not answer the question.

## Stage Gate Rule

Before starting the next document, verify that the previous step exists, references its dependencies, and meets its acceptance criteria. If verification fails, repair or document the gap first.

## Previous Step Verification

- Last verified step: Business Constitution v1.0 baseline
- Verification status: Complete enough to draft Master Specification v2.0
- Current required verification: Confirm Master Specification v2.0 accurately references the constitution and ADR-006 to ADR-008
- PRD status: Blocked until Checkpoint 1.1 approval
