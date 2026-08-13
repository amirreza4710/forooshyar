# Farakhorasan Product Roadmap v2.4

**Status:** Approved  
**Date:** 2026-08-04  
**Current Official Checkpoint:** 1.6 — MVP Delivery Ready  
**Next Checkpoint:** 1.7 — Engineering Foundation Ready

## Current Position

Delivery Readiness کامل و Frozen است. MVP شامل 11 Epic و 32 Feature متعهد است و در v2.4 هیچ Feature جدیدی اضافه نشده است.

Sprint 0 به وضعیت Release Candidate رسیده و فقط Target Environment Verification باقی مانده است.

## Stack Divergence Warning

The implemented repository stack is **React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, and OpenAPI**. Historical or external references to FastAPI / Next.js are non-authoritative unless approved by a future Decision Record. No migration, merge, replacement, or stack substitution is approved at this time. Agents must treat the current repository implementation and current governance docs as authoritative. Any future stack change must go through a Decision Record and update `README.md`, `PROJECT_STATE.md`, `AGENTS.md`, `docs/README.md`, `Roadmap.md`, and relevant development docs together.

## Phase A0 — Sprint 0 Engineering Foundation

Mandatory outputs:

1. Repository و Branch/PR rules
2. Modular Monolith skeleton
3. Bounded Context package boundaries
4. PostgreSQL و Migration baseline
5. Environment و secrets convention
6. Authentication foundation
7. API و error conventions
8. Audit minimum
9. Backup/Restore runbook و scripts
10. Structured logging و health/readiness
11. Seed data
12. CI minimum
13. Sprint 1 board با Feature ID

### Current validation evidence

```text
Alembic: PASS
Seed: PASS
Compile: PASS
Backend tests: 7/7 PASS
```

### Remaining exit gate

- Frontend production build
- Docker Compose runtime verification
- Backend tests inside container
- Host health/readiness checks
- PostgreSQL backup/restore test
- Seed Admin login و password rotation

پس از عبور از این Gate، Checkpoint 1.7 Frozen می‌شود.

## Phase A1 — Days 4–10: Operational Foundation

فقط:

- AUTH-F01 تا AUTH-F03
- SET-F01 تا SET-F03
- PRD-F01 تا PRD-F03
- CUS-F01 تا CUS-F03

Exit Gate: کاربر مجاز بتواند وارد شود، تنظیمات پایه، محصول و مشتری معتبر ایجاد کند و عملیات حساس Audit شوند.

## Phase A2 — Days 11–18: Sales Core

- ORD-F01 تا ORD-F03
- TAR-F01 تا TAR-F02

Exit Gate: مسیر Customer → Order → Target Achievement به‌صورت End-to-End کار کند.

## Phase A3 — Days 19–24: Performance and Cash

- KPI-F01 تا KPI-F03
- COM-F01 تا COM-F03
- COL-F01 تا COL-F03

Exit Gate: KPI و Commission از داده ردیابی‌پذیر محاسبه شوند و پرونده وصول تا ثبت پرداخت اجرا شود.

## Phase A4 — Days 25–27: Decision Layer

- DASH-F01 تا DASH-F03
- REP-F01 تا REP-F03

Exit Gate: Dashboard و گزارش‌های محدود عملیاتی از Source Domainها داده بخوانند و RBAC را رعایت کنند.

## Phase A5 — Days 28–30: Stabilization

- رفع خطاهای Critical و High
- Permission review
- Backup/restore test
- Data integrity checks
- Mobile/Desktop smoke test
- Release notes و Runbook
- Demo با داده کنترل‌شده

## MVP Cut Policy

در فشار زمانی ابتدا کاهش می‌یابند:

1. UIهای Planned/Disabled
2. نمودار و شخصی‌سازی Dashboard
3. تنوع فیلترها
4. تعداد گزارش‌ها
5. Exportهای غیرضروری

حذف نمی‌شوند:

- Authentication
- Permission enforcement
- Customers
- Products
- Orders
- Data integrity
- Audit minimum

## Explicitly Deferred

- Billing Engine و automated rating/invoicing/reconciliation
- Message Broker و Transactional Outbox
- Partner Portal و automated payout
- Marketplace
- Microservices
- Autonomous AI Agents

## Post-MVP Sequence

1. Stabilization با داده واقعی
2. Commercial Operations Foundation
3. Metering/Billing Foundation داخل Modular Monolith
4. Partner Automation
5. Conditional Distributed Architecture

هر مرحله فقط با Gate، داده واقعی و Decision Record جدید فعال می‌شود.

## Anti-Perfectionism Rule

- فقط یک Workstream فعال
- تغییر دامنه پیش‌فرض `POST_MVP_CANDIDATE`
- High-Fidelity UI فقط برای Sprint جاری
- Scope Review برای حذف و کوچک‌سازی
- پیشرفت با Demo و Working Software
