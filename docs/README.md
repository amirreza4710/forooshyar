# Documentation Index

`docs/` منبع حقیقت مستندات فروشیار پلاس است. هر تصمیم محصول، کسب‌وکار، UX، معماری و توسعه باید به مالک canonical خود قابل ردیابی باشد.

## Start Here

1. `PROJECT_STATE.md`
2. `AGENTS.md`
3. `README.md`
4. `docs/00_Project/governance-v2.4/README.md`
5. `docs/00_Project/Roadmap.md`
6. `docs/README.md`

## Architecture / Technical Context
Per ADR-0001, the implemented repository stack is **React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, and OpenAPI**. No migration, merge, replacement, or stack substitution is approved at this time. Agents must treat the current repository implementation and current governance docs as authoritative. Any future stack change must go through a Decision Record and update `README.md`, `PROJECT_STATE.md`, `AGENTS.md`, `docs/README.md`, `Roadmap.md`, and relevant development docs together.

## Current Baseline

- **Checkpoint رسمی:** 1.7 — Engineering Foundation Ready (Frozen)
- **Checkpoint بعدی:** A1 — Operational Foundation
- **MVP Backlog فعال:** 14 Epic و 41 Feature (ADR-010)
- **Current Work:** A1 Operational Foundation
- **Frozen baseline:** v2.4 با 11 Epic و 32 Feature

## Folder Map

| Folder | Purpose | Owner |
|---|---|---|
| `00_Project/` | Project state، roadmap، checkpoints، governance | Product Manager |
| `01_PRD/` | Product requirements و acceptance criteria | Product Manager |
| `02_Business/` | Constitution، policies، commercial rules | Business Analyst |
| `03_Domain/` | Domain model، entities، bounded contexts | System Architect |
| `04_Architecture/` | Architecture، integration، NFR | System Architect |
| `05_UX/` | Personas، journeys، flows | UX Designer |
| `06_UI/` | Screen specs، design system، tokens | UX/Frontend |
| `07_Figma/` | Handoff plans و generation prompts | UX Designer |
| `08_AI/` | AI governance، prompts، agents، evaluation | AI Architect |
| `09_Development/` | API، database، frontend، backend، deployment | Engineering |
| `ADR/` | Long-lived architecture/commercial decisions | Architecture/Product |
| `checkpoints/` | Approval snapshots | Product Manager |

## Governance v2.4

بسته جاری در مسیر زیر است:

`docs/00_Project/governance-v2.4/`

شامل:

- Project State & Continuity
- MVP Feature Admission & Backlog Summary
- Checkpoint 1.6
- Sprint 0 Execution Baseline
- Checkpoint 1.7 Candidate
- Sprint 0 Validation Report
- Change Log v2.4

## Accepted Decision Records

- ADR-006 — Pricing & Revenue Architecture
- ADR-007 — Partner Commercial Model
- ADR-008 — Event-Informed and Ledger-Based Billing
- ADR-010 — Forooshyar Plus Capability Integration
- ADR-011 — Forooshyar Plus Product Naming

## Active integration scope

`docs/01_PRD/FOROOSHYAR_PLUS_INTEGRATION.md` مالک canonical قابلیت‌های ادغام‌شدهٔ بازارک در فروشیار پلاس است. سند ورودی بازارک به‌عنوان baseline بیرونی نگهداری شده و ADR-010/ADR-011 تصمیم‌های لازم برای پذیرش و نام‌گذاری آن را ثبت می‌کنند.

## Change Rule

1. ابتدا مالک canonical تغییر کند.
2. برای تصمیم پایدار معماری یا تجاری Decision Record ثبت شود.
3. سپس `PROJECT_STATE.md`، Roadmap، README و Change Log همگام شوند.
4. Feature جدید پیش‌فرض `POST_MVP_CANDIDATE` است.
5. بخش Frozen بدون Decision Record باز نمی‌شود.
