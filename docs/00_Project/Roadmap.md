# Farakhorasan Product Roadmap v2.4

**Status:** Approved — Governance clarification pending review  
**Date:** 2026-08-20  
**Current Official Checkpoint:** 1.6 — MVP Delivery Ready  
**Next Checkpoint:** 1.7 — Engineering Foundation Ready

## Current Position

Delivery Readiness کامل و Frozen است. MVP شامل 11 Epic و 32 Feature متعهد است و در v2.4 هیچ Feature جدیدی اضافه نشده است.

Sprint 0 از نظر Repository به وضعیت Release Candidate رسیده، اما Target Environment Verification هنوز کامل و Evidence-based تأیید نشده است.

**Current active workstream: S0 Target Environment Verification.** تا Freeze شدن 1.7، توسعه Featureهای A1 مجاز نیست.

## Governance Pre-Implementation Gate

### Platform / Module Boundary

```text
Farakhorasan Platform
└── Forooshyar Sales module
```

- Farakhorasan Platform مرز سطح پلتفرم است.
- Forooshyar Sales ماژول/محصول فروش درون این پلتفرم است.
- MVP فعلی، Scope فروشیار است و کل پلتفرم Farakhorasan را پیاده‌سازی نمی‌کند.

### Mandatory Multi-tenancy Infrastructure

**Multi-tenancy زیرساخت اجباری معماری است.** این موضوع نباید به‌عنوان یک Feature اختیاری Post-MVP یا یک refactor آینده تلقی شود.

با این حال، implementation جزئیات schema/API/access-control فقط پس از ADR و Scope Review مجاز است. این Roadmap به‌تنهایی مجوز تغییر schema یا API نیست.

### بازاردان

«بازاردان» در وضعیت فعلی یک مفهوم/پوسته آینده پلتفرم است و **Feature اجرایی MVP محسوب نمی‌شود**.

هیچ Agent مجاز نیست shell، UI، API، schema، dependency یا deployment مربوط به بازاردان را قبل از ADR و Scope Review پیاده‌سازی کند.

### Implementation Rule

شروع کدنویسی برای:

- multi-tenancy implementation؛
- platform shell؛
- بازاردان؛
- یا هر تغییر architecture-impacting؛

فقط زمانی مجاز است که:

1. ADR مرتبط Accepted شده باشد؛
2. Scope Review آن را در Workstream/Phase فعال Admit کرده باشد؛
3. Acceptance Criteria و Architecture Impact ثبت شده باشد؛
4. تغییر از Cut Line مصوب خارج نباشد.

این PR فقط governance/documentation است و هیچ schema، API، UI، dependency یا deployment را تغییر نمی‌دهد.

## Execution State Model

هر Phase یکی از این وضعیت‌ها را دارد:

- `FROZEN` — Gate تأیید و قفل شده
- `ACTIVE` — تنها Workstream فعال
- `BLOCKED` — منتظر Gate قبلی
- `NOT STARTED` — هنوز فعال نشده
- `DONE` — خروجی‌های Phase تکمیل و Exit Gate پاس شده

هیچ Agent مجاز نیست بدون Evidence وضعیت `PENDING/UNVERIFIED` را `PASS/DONE` اعلام کند.

## Stack Divergence Warning

The implemented repository stack is **React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, and OpenAPI**. Historical or external references to FastAPI / Next.js are non-authoritative unless approved by a future Decision Record. No migration, merge, replacement, or stack substitution is approved at this time. Agents must treat the current repository implementation and current governance docs as authoritative. Any future stack change must go through a Decision Record and update `README.md`, `PROJECT_STATE.md`, `AGENTS.md`, `docs/README.md`, `Roadmap.md`, and relevant development docs together.

## Phase S0 — Target Environment Verification

**Status: ACTIVE**

هدف: اثبات Engineering Foundation روی Windows + Docker Desktop با Evidence واقعی.

### Required Gates

1. Frontend production build
2. Docker Compose build/up
3. Backend tests inside container
4. Host health/readiness
5. PostgreSQL backup
6. PostgreSQL restore test
7. Seed Admin login
8. Admin password rotation

### Additional integrity verification

- Soft-delete `deleted_at` در DB واقعی Target Environment با query read-only
- ثبت artifactهای backup/restore و test output
- ثبت دقیق محیط، نسخه ابزارها و زمان اجرا

**Exit Gate:** هر ۸ Gate PASS + Evidence ثبت‌شده + Checkpoint 1.7 Frozen.

## Checkpoint 1.7 — Engineering Foundation Ready

**Status: BLOCKED BY S0**

این Checkpoint فقط پس از عبور کامل S0 Frozen می‌شود. وجود Script یا Dockerfile به‌تنهایی Evidence محسوب نمی‌شود.

## Phase A1 — Days 4–10: Operational Foundation

**Status: NOT STARTED**

فقط:

- AUTH-F01 تا AUTH-F03
- SET-F01 تا SET-F03
- PRD-F01 تا PRD-F03
- CUS-F01 تا CUS-F03

Exit Gate: کاربر مجاز بتواند وارد شود، تنظیمات پایه، محصول و مشتری معتبر ایجاد کند و عملیات حساس Audit شوند.

## Phase A2 — Days 11–18: Sales Core

**Status: NOT STARTED**

- ORD-F01 تا ORD-F03
- TAR-F01 تا TAR-F02

Exit Gate: مسیر Customer → Order → Target Achievement به‌صورت End-to-End کار کند.

## Phase A3 — Days 19–24: Performance and Cash

**Status: NOT STARTED**

- KPI-F01 تا KPI-F03
- COM-F01 تا COM-F03
- COL-F01 تا COL-F03

Exit Gate: KPI و Commission از داده ردیابی‌پذیر محاسبه شوند و پرونده وصول تا ثبت پرداخت اجرا شود.

## Phase A4 — Days 25–27: Decision Layer

**Status: NOT STARTED**

- DASH-F01 تا DASH-F03
- REP-F01 تا REP-F03

Exit Gate: Dashboard و گزارش‌های محدود عملیاتی از Source Domainها داده بخوانند و RBAC را رعایت کنند.

## Phase A5 — Days 28–30: Stabilization

**Status: NOT STARTED**

- رفع خطاهای Critical و High
- Permission review
- Backup/restore test
- Data integrity checks
- Mobile/Desktop smoke test
- Release notes و Runbook
- Demo با داده کنترل‌شده

## Phase DP — Design Partner Pilot

**Status: NOT STARTED**

پس از MVP Release:

- یک سازمان
- حداکثر ۶ کاربر میدانی
- راه‌اندازی فرآیند
- مهاجرت داده اولیه
- آموزش
- Dashboard
- KPI قبل/بعد
- گزارش ROI نهایی

هدف: اثبات ارزش مشتری اندازه‌گیری‌شده، نه صرفاً تحویل نرم‌افزار.

## Phase Status Board

| Phase | Status | Blocking condition | Owner focus |
|---|---|---|---|
| 1.6 | FROZEN | — | PM / Architecture |
| S0 | ACTIVE | Target Environment | DevOps / QA |
| 1.7 | BLOCKED | S0 | PM / QA / DevOps |
| A1 | NOT STARTED | 1.7 | Backend / Frontend / QA |
| A2 | NOT STARTED | A1 | Backend / Frontend / QA |
| A3 | NOT STARTED | A2 | Backend / QA / BA |
| A4 | NOT STARTED | A3 | Frontend / Backend / UX / QA |
| A5 | NOT STARTED | A4 | QA / DevOps / PM |
| DP | NOT STARTED | MVP Release | PM / BA / Customer-facing team |

## Agent Coordination Protocol

تمام Agentها باید قبل از شروع کار:

1. `PROJECT_STATE.md`
2. `AGENTS.md`
3. `README.md`
4. `docs/00_Project/governance-v2.4/README.md`
5. `docs/00_Project/Roadmap.md`
6. `docs/README.md`

را بخوانند.

هر Agent بعد از اقدام مهم باید وضعیت را در `PROJECT_STATE.md` و در صورت نیاز `PROJECT_STATUS.md` ثبت کند و این قالب را پر کند:

```text
What changed:
Evidence:
Remaining blockers:
Next action:
```

اگر Agent به محیط واقعی دسترسی ندارد، باید صریحاً `UNVERIFIED` ثبت کند.
اگر Gate قبلی کامل نیست، Agent باید Forward Progress را متوقف کند.

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
- Multi-tenancy architectural boundary

## Explicitly Deferred

- Billing Engine و automated rating/invoicing/reconciliation
- Message Broker و Transactional Outbox
- Partner Portal و automated payout
- Marketplace
- Microservices
- Autonomous AI Agents
- بازاردان executable shell

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
