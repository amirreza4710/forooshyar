# PROJECT_STATE.md

این فایل حافظه کوتاه‌مدت و نقطه شروع مخزن است. هر انسان یا Agent باید پیش از بارگذاری اسناد عمیق‌تر، این فایل را بخواند. این فایل وضعیت اجرایی را نگه می‌دارد، نه صرفاً برنامه آینده را.

## Current State

- **Project:** Farakhorasan Sales OS / فروشیار
- **Market Position:** Sales & Distribution Operating Platform
- **Internal Vision:** Domain-Driven Business Operating Platform
- **Architecture:** Modular Monolith با Bounded Contextهای روشن
- **Authoritative Stack:** React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, OpenAPI
- **Current Official Checkpoint:** **1.6 — MVP Delivery Ready (Approved & Frozen)**
- **Next Checkpoint:** **1.7 — Engineering Foundation Ready (Candidate, Not Frozen)**
- **Current Workstream:** Sprint 0 — Target Environment Verification
- **MVP Scope:** Frozen
- **MVP Backlog:** 11 Epic و 32 Feature متعهد
- **New Features Added in v2.4:** صفر
- **Status:** ENGINEERING FOUNDATION RELEASE CANDIDATE

## Execution Rule

تا زمانی که Checkpoint 1.7 با Evidence واقعی روی Target Environment تأیید و Frozen نشده است، توسعه Featureهای Sprint 1 مجاز نیست.

فقط **یک Workstream اجرایی** در هر لحظه فعال است. هر Agent قبل از شروع کار باید این فایل را بخواند و پس از پایان هر اقدام مهم، وضعیت، Evidence، Blocker و Next Action را در همین فایل و در صورت لزوم `PROJECT_STATUS.md` ثبت کند.

## Completed / Frozen Phases

### Checkpoint 1.6 — MVP Delivery Ready
**Status: APPROVED & FROZEN**

- Business و Product Foundation
- Product Constitution و تصمیم‌های تجاری/معماری پذیرفته‌شده
- Domain، API، Database و UX baselines
- MVP 30-Day Scope
- Feature Admission Audit
- MVP Backlog و Cut Line
- Repository/Architecture baseline
- Modular Monolith package boundaries
- Authentication foundation
- Audit minimum
- API/Error conventions
- Structured logging و Request ID
- Health/Readiness endpoints
- Seed foundation
- CI definition
- Backup/Restore scripts
- Sprint 1 board / Feature IDs

### Sprint 0 — Release Candidate
**Status: IMPLEMENTED, TARGET VERIFICATION PENDING**

Artifacts موجود در Repository شامل Docker Compose، Dockerfileهای API/Web و اسکریپت‌های PowerShell مربوط به Initialize، Backup، Restore و Verify هستند. این وجود به‌تنهایی Evidence اجرای واقعی محسوب نمی‌شود.

## Current Gaps / Blockers

### GATE-1.7-01 — Frontend production build
- **Status:** PENDING TARGET VERIFICATION
- **Evidence required:** موفقیت build تولیدی روی محیط هدف

### GATE-1.7-02 — Docker Compose build/up
- **Status:** PENDING TARGET VERIFICATION
- **Evidence required:** اجرای واقعی `docker compose build` و `docker compose up` روی Windows + Docker Desktop

### GATE-1.7-03 — Backend tests inside container
- **Status:** PENDING TARGET VERIFICATION
- **Evidence required:** تست موفق داخل container، نه فقط host/CI

### GATE-1.7-04 — Host Health/Readiness
- **Status:** PENDING TARGET VERIFICATION
- **Evidence required:** پاسخ موفق Health و Readiness از Host

### GATE-1.7-05 — PostgreSQL backup
- **Status:** PENDING TARGET VERIFICATION
- **Evidence required:** dump واقعی PostgreSQL با artifact قابل شناسایی

### GATE-1.7-06 — PostgreSQL restore
- **Status:** PENDING TARGET VERIFICATION
- **Evidence required:** restore واقعی از backup و صحت‌سنجی داده/Schema

### GATE-1.7-07 — Seed Admin login
- **Status:** PENDING TARGET VERIFICATION
- **Evidence required:** login واقعی با Admin seed شده و پاسخ موفق احراز هویت

### GATE-1.7-08 — Admin password rotation
- **Status:** PENDING TARGET VERIFICATION
- **Evidence required:** تغییر رمز، ورود با رمز جدید و رد شدن رمز قبلی

## Known Repository / Documentation Inconsistencies

- برخی گزارش‌های قدیمی مانند `ISSUES_AND_IMPROVEMENTS.md` وضعیت Docker/Compose و اسکریپت‌های Sprint 0 را ناقص گزارش می‌کنند؛ وضعیت فعلی Repository وجود این artifacts را نشان می‌دهد. این گزارش‌ها باید هنگام استفاده به‌عنوان historical evidence در نظر گرفته شوند، نه Current State.
- در برخی اسناد قدیمی عبارت `Alembic: PASS` وجود دارد، در حالی که Stack رسمی و authoritative پروژه PostgreSQL + Drizzle ORM است. این عبارت نباید به‌عنوان Evidence فعلی Checkpoint 1.7 استفاده شود.
- وضعیت Soft Delete در Code/Schema تعریف شده است، اما اثبات وضعیت DB واقعی Target Environment بخشی از Verification محیط هدف است و نباید از روی Code به‌تنهایی فرض شود.

## Execution Roadmap

```text
1.6 Frozen
  ↓
S0 — Target Environment Verification
  ↓
1.7 Freeze
  ↓
A1 — Operational Foundation
     AUTH-F01..F03 / SET-F01..F03 / PRD-F01..F03 / CUS-F01..F03
  ↓
A2 — Sales Core
     ORD-F01..F03 / TAR-F01..F02
  ↓
A3 — Performance & Cash
     KPI-F01..F03 / COM-F01..F03 / COL-F01..F03
  ↓
A4 — Decision Layer
     DASH-F01..F03 / REP-F01..F03
  ↓
A5 — Stabilization
  ↓
MVP Demo / Release
  ↓
Design Partner Pilot
```

## Phase Gates

| Phase | Gate | وضعیت فعلی | شرط عبور |
|---|---|---|---|
| 1.6 | MVP Delivery Ready | FROZEN | قبلاً تأیید شده |
| S0 | Target Environment Verification | ACTIVE | هر ۸ Gate با Evidence |
| 1.7 | Engineering Foundation Ready | BLOCKED BY S0 | Gateهای S0 پاس شوند |
| A1 | Operational Foundation | NOT STARTED | 12 Feature + Exit Gate |
| A2 | Sales Core | NOT STARTED | 5 Feature + E2E |
| A3 | Performance & Cash | NOT STARTED | 9 Feature + traceability |
| A4 | Decision Layer | NOT STARTED | Dashboard/Report operational |
| A5 | Stabilization | NOT STARTED | Critical/High صفر یا accepted |
| DP | Design Partner | NOT STARTED | MVP release + controlled pilot |

## Agent Execution Protocol

هر Agent باید:

1. `PROJECT_STATE.md` را بخواند.
2. `AGENTS.md` و اسناد حاکم را طبق ترتیب canonical بخواند.
3. فقط Task مربوط به Workstream فعال را اجرا کند.
4. قبل از تغییر کد، وضعیت Gate قبلی را بررسی کند.
5. هیچ Feature جدیدی را خارج از Cut Line شروع نکند.
6. پس از هر کار مهم، `PROJECT_STATE.md` و در صورت نیاز `PROJECT_STATUS.md` را به‌روزرسانی کند.
7. برای هر تغییر، این چهار مورد را ثبت کند: **What changed / Evidence / Remaining blockers / Next action**.
8. اگر چیزی اجرا نشده، آن را `PENDING` یا `UNVERIFIED` بنویسد، نه `PASS`.
9. اگر Blocker کشف شد، Forward Progress را متوقف و Blocker را ثبت کند.
10. تغییر معماری را بدون ADR انجام ندهد.

## Agent Ownership

- **PM Agent:** Scope، milestone، prioritization، phase status
- **BA Agent:** Business rules، constraints، acceptance criteria
- **UX Agent:** User journeys، flows، usability
- **System Architect:** Boundaries، architecture، ADR consistency
- **Backend Agent:** API، domain logic، persistence
- **Frontend Agent:** UI، state، frontend integration
- **QA Agent:** Test strategy، regression، acceptance gates
- **DevOps Agent:** Docker، CI/CD، environment، backup/restore، observability
- **AI Architect Agent:** AI boundaries و governance؛ فقط در scope مصوب

## Mandatory Next Action

**فقط Target Environment Verification اجرا شود.** توسعه Sprint 1 تا Freeze شدن 1.7 متوقف است.

اجرای محیط هدف باید شامل این توالی باشد:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\Initialize-Farakhorasan.ps1
.\scripts\Backup-Database.ps1
$LatestBackup = Get-ChildItem .\backups\*.dump | Sort-Object LastWriteTime -Descending | Select-Object -First 1
.\scripts\Restore-Database.ps1 -BackupFile $LatestBackup.FullName
.\scripts\Verify-Sprint0.ps1
```

**توجه:** خروجی این Scriptها باید به‌صورت Evidence ثبت شود و صرفاً پیام موفقیت Script ملاک Pass نیست. مخصوصاً Login، Password Rotation و Restore باید با Assertion مستقل تأیید شوند.

## What Is Frozen

- Business و Product Foundation
- Product Constitution و تصمیم‌های تجاری/معماری پذیرفته‌شده
- Domain، API، Database و UX baselines
- MVP 30-Day Scope
- Feature Admission Audit
- MVP Backlog و Cut Line
- Checkpoint 1.6

## Explicitly Outside MVP

- Billing Engine و Automated Rating/Invoice/Reconciliation
- Message Broker و Transactional Outbox
- Partner Portal و Delegated Tenant Access UI
- Automated Partner Commission/Payout
- Marketplace
- Microservices decomposition
- Autonomous AI Agents

## Stack Divergence Warning

The implemented and authoritative repository stack is **React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, and OpenAPI**. Historical or external references to FastAPI or Next.js are non-authoritative and must be ignored unless explicitly approved by a future Decision Record. No migration, merge, replacement, or stack substitution is approved at this time. Agents must treat the current repository implementation and current governance docs as authoritative. Any future stack change must go through a Decision Record and update all governance documents together.

## Agent Loading Strategy

1. `PROJECT_STATE.md`
2. `AGENTS.md`
3. `README.md`
4. `docs/00_Project/governance-v2.4/README.md`
5. `docs/00_Project/Roadmap.md`
6. `docs/README.md`

## Anti-Perfectionism Rule

- فقط یک Workstream اجرایی فعال باشد.
- Feature جدید پیش‌فرض Post-MVP است.
- Scope Review برای حذف و کوچک‌سازی است، نه افزودن.
- Design فقط برای Sprint جاری تولید می‌شود.
- پیشرفت با Working Software و Demo سنجیده می‌شود، نه تعداد سند.

## Operations Note

GitHub Actions PR validation (`.github/workflows/ai-pr-check.yml`) و baseline معماری (`ARCHITECTURE_GRAPH.md`) در Repository ثبت شده‌اند.
