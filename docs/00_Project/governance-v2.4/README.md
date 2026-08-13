# Farakhorasan Governance v2.4

**Status:** Approved — MVP Delivery Ready  
**Date:** 2026-08-04  
**Official Checkpoint:** 1.6  
**Next Candidate:** 1.7

## Purpose

این پوشه خط مبنای حاکمیت تحویل، Backlog قفل‌شده و شواهد Sprint 0 را ثبت می‌کند. هدف جلوگیری از بازشدن دوباره فازهای Frozen و تورم دامنه است.

## Start Here

1. `PROJECT_STATE.md`
2. `AGENTS.md`
3. `README.md`
4. `docs/00_Project/governance-v2.4/README.md`
5. `docs/00_Project/Roadmap.md`
6. `docs/README.md`

*(پیوست‌های این پوشه پس از مطالعه منابع بالا قابل مراجعه هستند)*

## Current Truth

- Market Position: Sales & Distribution Operating Platform
- Internal Vision: Domain-Driven Business Operating Platform
- Architecture: Modular Monolith
- MVP: 11 Epic و 32 Feature، Frozen
- Feature جدید در v2.4: صفر
- Current Work: Sprint 0 target-environment verification
- Official Checkpoint: 1.6
- Checkpoint 1.7: Candidate، نه Frozen

## Explicit Exclusions

Billing Engine، Message Broker، Partner Portal، Automated Payout، Marketplace، Microservices و Autonomous AI Agents خارج از MVP هستند.

## Stack Divergence Warning

The implemented repository stack is **React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, and OpenAPI**. Historical or external references to FastAPI / Next.js are non-authoritative unless approved by a future Decision Record. No migration, merge, replacement, or stack substitution is approved at this time. Agents must treat the current repository implementation and current governance docs as authoritative. Any future stack change must go through a Decision Record and update `README.md`, `PROJECT_STATE.md`, `AGENTS.md`, `docs/README.md`, `Roadmap.md`, and relevant development docs together.

## Anti-Perfectionism

- یک Workstream فعال
- تغییر دامنه پیش‌فرض Post-MVP
- Scope Review برای حذف
- Design فقط برای Sprint جاری
- Working Software معیار پیشرفت
