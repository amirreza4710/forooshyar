# Farakhorasan Product Roadmap v2.4

## Purpose / Overview
**Status:** Approved — Governance clarification pending review  
**Date:** 2026-08-20  
**Current Official Checkpoint:** 1.6 — MVP Delivery Ready  
**Next Checkpoint:** 1.7 — Engineering Foundation Ready

Delivery Readiness کامل و Frozen است. MVP شامل 11 Epic و 32 Feature متعهد است و در v2.4 هیچ Feature جدیدی اضافه نشده است.

## Current Status
**Current active workstream: S0 Target Environment Verification.**
Sprint 0 از نظر Repository به وضعیت Release Candidate رسیده، اما Target Environment Verification هنوز کامل و Evidence-based تأیید نشده است (BLOCKED در Sandbox). تا Freeze شدن 1.7، توسعه Featureهای A1 مجاز نیست.

## Architecture / Technical Context
The implemented repository stack is **React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, and OpenAPI**. (Per ADR-0001, any references to FastAPI or Next.js are obsolete). No migration, merge, replacement, or stack substitution is approved at this time.

### Mandatory Multi-tenancy Infrastructure
**Multi-tenancy زیرساخت اجباری معماری است.** این موضوع نباید به‌عنوان یک Feature اختیاری Post-MVP تلقی شود. Implementation جزئیات schema/API/access-control فقط پس از ADR و Scope Review مجاز است.

### بازاردان
«بازاردان» در وضعیت فعلی یک مفهوم/پوسته آینده پلتفرم است و **Feature اجرایی MVP محسوب نمی‌شود**. هیچ Agent مجاز نیست shell، UI، API، یا schema مربوط به بازاردان را قبل از ADR و Scope Review پیاده‌سازی کند.

## Implementation / Operational Details (Rules)
شروع کدنویسی برای multi-tenancy implementation، platform shell، بازاردان، یا هر تغییر architecture-impacting فقط زمانی مجاز است که:
1. ADR مرتبط Accepted شده باشد؛
2. Scope Review آن را در Workstream/Phase فعال Admit کرده باشد؛
3. Acceptance Criteria و Architecture Impact ثبت شده باشد؛
4. تغییر از Cut Line مصوب خارج نباشد.

## Phase Status Board

| Phase | Status | Blocking condition | Owner focus |
|---|---|---|---|
| 1.6 | FROZEN | — | PM / Architecture |
| S0 | ACTIVE (BLOCKED) | Target Environment Verification | DevOps / QA |
| 1.7 | CANDIDATE (BLOCKED)| S0 | PM / QA / DevOps |
| A1 | NOT STARTED | 1.7 | Backend / Frontend / QA |
| A2 | NOT STARTED | A1 | Backend / Frontend / QA |
| A3 | NOT STARTED | A2 | Backend / QA / BA |
| A4 | NOT STARTED | A3 | Frontend / Backend / UX / QA |
| A5 | NOT STARTED | A4 | QA / DevOps / PM |
| DP | NOT STARTED | MVP Release | PM / BA / Customer-facing team |

## Next Steps / Phase Details

### Phase S0 — Target Environment Verification
**Status: ACTIVE (BLOCKED)**
هدف: اثبات Engineering Foundation روی Windows + Docker Desktop با Evidence واقعی. (در حال حاضر به دلیل محدودیت‌های Sandbox مسدود است).

### Checkpoint 1.7 — Engineering Foundation Ready
**Status: BLOCKED BY S0**
این Checkpoint فقط پس از عبور کامل S0 Frozen می‌شود. وجود Script یا Dockerfile به‌تنهایی Evidence محسوب نمی‌شود.

### Phase A1 — Days 4–10: Operational Foundation
**Status: NOT STARTED**
فقط: AUTH-F01/03, SET-F01/03, PRD-F01/03, CUS-F01/03. (مشروط به قفل شدن 1.7)

*(سایر فازها A2 تا A5 و DP به محض اتمام فازهای قبل فعال خواهند شد، مطابق جدول بالا).*

## Scope / MVP Cut Policy
در فشار زمانی ابتدا کاهش می‌یابند: UIهای Planned/Disabled، نمودار و شخصی‌سازی Dashboard، تنوع فیلترها، تعداد گزارش‌ها، Exportهای غیرضروری.
**Explicitly Deferred (خارج از MVP):** Billing Engine، Message Broker، Partner Portal، Marketplace، Microservices، Autonomous AI Agents، بازاردان executable shell.

## Post-MVP Sequence
1. Stabilization با داده واقعی
2. Commercial Operations Foundation
3. Metering/Billing Foundation داخل Modular Monolith
4. Partner Automation
5. Conditional Distributed Architecture
