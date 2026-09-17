# Documentation Index

## Purpose / Overview
`docs/` منبع حقیقت مستندات فراخراسان است. هر تصمیم محصول، کسب‌وکار، UX، معماری و توسعه باید به مالک canonical خود قابل ردیابی باشد.

## Architecture / Technical Context
The implemented repository stack is **React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, and OpenAPI**. Historical references to FastAPI or Next.js are non-authoritative (per ADR-0001). Any future stack change must go through a Decision Record and update relevant documentation together.

## Current Status
- **Checkpoint رسمی:** 1.6 — MVP Delivery Ready
- **Checkpoint بعدی:** 1.7 — Engineering Foundation Ready (Candidate / Blocked)
- **MVP Backlog:** 11 Epic و 32 Feature، Frozen
- **Current Work:** Sprint 0 Target Environment Verification (Active, unverified on target env)

## References (Start Here)
1. `PROJECT_STATE.md`
2. `AGENTS.md`
3. `README.md`
4. `docs/00_Project/governance-v2.4/README.md`
5. `docs/00_Project/Roadmap.md`
6. `docs/README.md`

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

## Governance v2.4 (Active Package)
بسته جاری در مسیر زیر است: `docs/00_Project/governance-v2.4/`

## Requirements / Change Rule
1. ابتدا مالک canonical تغییر کند.
2. برای تصمیم پایدار معماری یا تجاری Decision Record ثبت شود.
3. سپس `PROJECT_STATE.md`، Roadmap، README و Change Log همگام شوند.
4. Feature جدید پیش‌فرض `POST_MVP_CANDIDATE` است.
5. بخش Frozen بدون Decision Record باز نمی‌شود.
