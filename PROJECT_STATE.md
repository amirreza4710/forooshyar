# PROJECT_STATE.md

این فایل حافظه کوتاه‌مدت و نقطه شروع مخزن است. هر انسان یا Agent باید پیش از بارگذاری اسناد عمیق‌تر، این فایل را بخواند. این فایل وضعیت اجرایی را نگه می‌دارد، نه صرفاً برنامه آینده را.

## Current State

- **Project:** Forooshyar Plus
- **Market Position:** Sales & Distribution Operating Platform with Field Operations and Automation
- **Internal Vision:** Domain-Driven Business Operating Platform
- **Architecture:** Modular Monolith با Bounded Contextهای روشن
- **Authoritative Stack:** React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, OpenAPI
- **Current Official Checkpoint:** **1.7 — Engineering Foundation Ready (Approved & Frozen)**
- **Next Checkpoint:** **A1 — Operational Foundation**
- **Current Workstream:** Phase A1 — Operational Foundation
- **MVP Scope:** Frozen
- **MVP Backlog:** 14 Epic و 41 Feature متعهد (ADR-010)
- **Frozen v2.4 baseline:** 11 Epic و 32 Feature
- **Status:** PHASE A1 ACTIVE
- **A1 Acceptance Criteria:** `docs/01_PRD/A1-Acceptance-Criteria.md` (۳ تصمیم باز: D1 محتوای تنظیمات، D2 تغییر رمز توسط کاربر، D3 Audit)

## Execution Rule

Checkpoint 1.7 is Frozen. Development for Phase A1 can proceed.

فقط **یک Workstream اجرایی** در هر لحظه فعال است. هر Agent قبل از شروع کار باید این فایل را بخواند و پس از پایان هر اقدام مهم، وضعیت، Evidence، Blocker و Next Action را در همین فایل و در صورت لزوم `PROJECT_STATUS.md` ثبت کند.

## Governance Gate — Platform / Module / Multi-tenancy

- **Platform boundary:** `Farakhorasan Platform`
- **Sales module:** `Forooshyar Plus`
- **Relationship:** `Farakhorasan Platform → Forooshyar Plus module`
- **Multi-tenancy:** اجباری به‌عنوان زیرساخت معماری؛ یک قابلیت اختیاری Post-MVP محسوب نمی‌شود.
- **بازاردان:** در وضعیت فعلی یک مفهوم/پوسته آینده پلتفرم است و **Feature اجرایی MVP نیست**.
- **بازارک:** نام سابق/منبع قابلیت‌های عملیات میدانی و اتوماسیون در فروشیار پلاس است، نه محصول مستقل.
- **Implementation gate:** شروع کدنویسی مربوط به multi-tenancy، platform shell، بازاردان یا هر تغییر architecture-impacting فقط پس از ADR پذیرفته‌شده + Scope Review + Acceptance Criteria مجاز است.
- این تغییرات در این PR فقط مستندسازی شده‌اند و **هیچ تغییر schema/API/UI/dependency/deployment** را مجاز نمی‌کنند.

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

### Sprint 0 — Target Environment Verification
**Status: APPROVED & FROZEN**

Artifacts موجود در Repository شامل Docker Compose، Dockerfileهای API/Web و اسکریپت‌های PowerShell مربوط به Initialize، Backup، Restore و Verify هستند. این وجود به‌تنهایی Evidence اجرای واقعی محسوب نمی‌شود.

## Sprint 0 Verification Evidence

**Status: ALL GATES PASS — verified on the target environment**

- **Environment:** Windows 10.0.26100 + Docker Desktop (Docker 29.8.0، Compose v5.5.1)، Node v24.12.0 روی Host و node 22.23.3 داخل container، pnpm 11.21.0
- **Date:** 2026-09-29
- **Sequence:** `Initialize-Farakhorasan.ps1` → `Backup-Database.ps1` → `Restore-Database.ps1` → `Verify-Sprint0.ps1`
- **Result:** هر ۸ گیت + `GATE-1.7-06.5` + `GATE-1.7-06.6` + `DB-CHECK` با PASS و خروج با کد 0

| Gate | Status | Evidence |
|---|---|---|
| GATE-1.7-01 Frontend production build | PASS | `pnpm --filter @workspace/nadraan run build` → build موفق و تولید `dist/public/assets/index-*.js` و `.css`؛ همان build داخل ایمیج `web` نیز اجرا شد |
| GATE-1.7-02 Docker Compose build/up | PASS | `docker compose build` → ایمیج‌های `forooshyar-api` و `forooshyar-web` ساخته شدند؛ `docker compose up` → `db` healthy، `api` healthy، `web` Up |
| GATE-1.7-03 Backend tests inside container | PASS با اخطار | اجرای واقعی stage `tester` با `DATABASE_URL` کانتینر → `Test Files 9 passed (9)`، `Tests 46 passed (46)`. ⚠️ این گیت در کانتینر **شکننده** است: در ۳ از ۱۰ اجرا یک تست به‌دلیل تایماوت hook شکست می‌خورد. جزئیات در بخش Current Gaps |
| GATE-1.7-04 Host Health/Readiness | PASS | `GET /api/healthz` → 200 و `GET /api/readyz` → 200 (شامل اتصال واقعی به PostgreSQL) |
| GATE-1.7-05 PostgreSQL backup | PASS | تولید artifact قابل شناسایی `backups/farakhorasan_20260929-*.dump` با `pg_dump -F c` |
| GATE-1.7-06 PostgreSQL restore | PASS | `DROP DATABASE` → `CREATE DATABASE` → `pg_restore` بدون خطا؛ جداول `users`، `customers`، `products`، `orders`، `refresh_tokens` و ستون `deleted_at` موجودند |
| GATE-1.7-07 Seed Admin login | PASS | `POST /api/dev/seed-admin` → 200/201 و `POST /api/auth/login` با Admin seed شده توکن معتبر برگرداند |
| GATE-1.7-08 Admin password rotation | PASS | تغییر رمز، ورود موفق با رمز جدید، و **رد شدن رمز قبلی با 401** |
| GATE-1.7-06.5 Drizzle schema sync | PASS | `pnpm --filter @workspace/db run push` بعد از restore → `No changes detected` |
| DB-CHECK soft-delete columns | PASS | `information_schema.columns` برای `users/customers/products/orders` ستون `deleted_at` را تأیید کرد |

### Residual limitations

- Backup/Restore روی دیتابیسی تقریباً خالی (schema-only، حجم dump حدود ۸۵۷ بایت) اجرا شد. صحت **Schema** تأیید شده است، اما صحت‌سنجی محتوا و حجم داده تجاری انجام نشده و باید پس از ورود دادهٔ واقعی تکرار شود.
- عبور گیت‌ها پیش از این ممکن نبود؛ در همین اجرا هفت نقص واقعی کشف و رفع شد. جزئیات در کامیت‌های `e49b70d`، `2b7073e`، `4850588`، `27e6576`، `7ee0fcd` و در `CHANGELOG.md`.
- **تصحیح علت crash:** توقف کانتینر API **فقط** از مسیر نادرست فایل worker در runner stage بود (`/app/dist` در برابر مسیر پخته‌شده `/app/artifacts/api-server/dist`). اعتبارسنجی `ERR_ERL_KEY_GEN_IPV6` در `express-rate-limit` فقط لاگ می‌شود و کشنده نبود؛ اصلاح `ipKeyGenerator` یک سخت‌سازی امنیتی مستقل (جلوگیری از دورزدن محدودیت ورود با IPv6) است، نه رفع crash.
- اسکریپت‌های Sprint 0 پیش از این اجرا نیز «توخالی» بودند: `GATE-1.7-03` فقط ایمیج می‌ساخت و تست‌ها را اجرا نمی‌کرد، و گیت رمز عبور با رمزی کار می‌کرد که خود اسکریپت محلی می‌ساخت، نه رمز واقعی container. هر دو اصلاح شده‌اند.

## Current Gaps / Blockers

### OPEN-1 — شکنندگی سوئیت API داخل کانتینر (GATE-1.7-03)

- **Status:** OPEN — پذیرفته‌شده و مستند، نه رفع‌شده
- **Symptom:** در محیط کانتینر، به‌طور متناوب یک تست با `Test timed out` یا `Hook timed out` شکست می‌خورد؛ هرگز خطای assertion نیست و تست شکست‌خورده در هر اجرا تغییر می‌کند.
- **Measured:** کانتینر ۳ شکست در ۱۰ اجرا (و ۱ در ۵، ۲ در ۵ در اندازه‌گیری‌های جداگانه)؛ هاست ۹ اجرای متوالی بدون هیچ شکست.
- **Scope:** فقط اجرای تست **داخل** کانتینر (گیت ۳ اسکریپت Sprint 0). هاست و CI از آن اثر نمی‌گیرند، چون CI تست‌ها را روی runner میزبان با سرویس PostgreSQL اجرا می‌کند، نه داخل ایمیج اپ.
- **Fixed along the way:** حذف `pool.end()` از `afterAll` دو فایل تست (pool مشترک module-level بود)، ایمن‌سازی مدیریت `process.env` در تست تازه، و بالا بردن سقف تایماوت از ۵s به ۱۵s برای سوئیت integration در کانتینر.
- **Ruled out:** موازی‌سازی فایل‌ها — با `--no-file-parallelism` هم ۲ از ۵ اجرا شکست خورد.
- **Unresolved:** علت قطعی مشخص نشده؛ آزمون بعدی، instrument کردن رویدادهای `pool` (connect/acquire/release) و نمونه‌برداری `pg_locks` / `pg_stat_activity` در لحظهٔ استال است.
- **Decision:** timebox شد و به‌عنوان نقص باز ثبت شد؛ A1 با گیت‌های هاست و CI جلو می‌رود.

## Known Repository / Documentation Inconsistencies

- برخی گزارش‌های قدیمی مانند `ISSUES_AND_IMPROVEMENTS.md` وضعیت Docker/Compose و اسکریپت‌های Sprint 0 را ناقص گزارش می‌کنند؛ وضعیت فعلی Repository وجود این artifacts را نشان می‌دهد. این گزارش‌ها باید هنگام استفاده به‌عنوان historical evidence در نظر گرفته شوند، نه Current State.
- در برخی اسناد قدیمی عبارت `Alembic: PASS` وجود دارد، در حالی که Stack رسمی و authoritative پروژه PostgreSQL + Drizzle ORM است. این عبارت نباید به‌عنوان Evidence فعلی Checkpoint 1.7 استفاده شود.
- وضعیت Soft Delete در Code/Schema تعریف شده است، اما اثبات وضعیت DB واقعی Target Environment بخشی از Verification محیط هدف است و نباید از روی Code به‌تنهایی فرض شود. (اکنون در `DB-CHECK` تأیید شده است.)
- بستهٔ `docs/00_Project/governance-v2.4/` یک snapshot تاریخی تاریخ‌دار (2026-08-04) است و هنوز «Checkpoint 1.6 / 1.7 CANDIDATE (BLOCKED)» را نشان می‌دهد. مرجع وضعیت فعلی فقط `PROJECT_STATE.md` است؛ این بسته نباید به‌عنوان وضعیت جاری خوانده شود.

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
     معیار پذیرش: docs/01_PRD/A1-Acceptance-Criteria.md
  ↓
A2 — Sales & Field Core
     ORD-F01..F03 / TAR-F01..F02 / VIS-F01..F03
  ↓
A3 — Performance, Cash & Automation
     KPI-F01..F03 / COM-F01..F03 / COL-F01..F03 / ALT-F01..F03 / AUT-F01..F03
  ↓
A4 — Decision Layer
     DASH-F01..F03 / REP-F01..REP-F03
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
| S0 | Target Environment Verification | FROZEN | هر ۸ Gate با Evidence |
| 1.7 | Engineering Foundation Ready | FROZEN | Gateهای S0 پاس شوند |
| A1 | Operational Foundation | ACTIVE | 12 Feature + Exit Gate |
| A2 | Sales & Field Core | NOT STARTED | 8 Feature + Visit → Order E2E |
| A3 | Performance, Cash & Automation | NOT STARTED | 15 Feature + traceability |
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
11. برای multi-tenancy، platform shell یا بازاردان، قبل از کدنویسی وجود ADR پذیرفته‌شده و Scope Review را بررسی کند.

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
- Checkpoint 1.7

## Explicitly Outside MVP

- Billing Engine و Automated Rating/Invoice/Reconciliation
- Message Broker و Transactional Outbox
- Partner Portal و Delegated Tenant Access UI
- Automated Partner Commission/Payout
- Marketplace
- Microservices decomposition
- Autonomous AI Agents
- بازاردان executable shell

## Architecture / Technical Context

Per ADR-0001, the implemented and authoritative repository stack is **React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, and OpenAPI**. No migration, merge, replacement, or stack substitution is approved at this time. Agents must treat the current repository implementation and current governance docs as authoritative. Any future stack change must go through a Decision Record and update all governance documents together.

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

## Checkpoint 1.7 Status Update
What changed: Frontend Vite build zero-config fallback applied. Pino unhandled exception test logs filtered for <500 status codes. Checkpoint 1.7 has officially passed and frozen.
Evidence: Verified frontend production build successfully works headless without manual ENVs, typecheck passes across all workspaces.
Remaining blockers: None.
Next action: Proceed to Phase A1 Operational Foundation.

## Recent Actions
- Two defects found while reading the A1 codebase were closed: (a) `orders.code` still used the count-based generator that A1 had already replaced for products/customers, and `orders.code` had no uniqueness constraint — it now derives from the row id and is unique, with regression tests for reuse-after-hard-delete and DB-level uniqueness; (b) `GET /api/notifications` was reachable without a token (verified live: `200` anonymous vs `401` for `/products`), so both notification endpoints are now behind `requireAuth` and the stream no longer takes the token from the URL.
- Evidence: `pnpm run typecheck` PASS، `pnpm run build` PASS، API suite **63/63 در 12 فایل** روی هاست PASS، `db push` قید `orders_code_unique` را ساخت، و روی استک بازسازی‌شده: `login 200`، `GET /api/notifications` بدون توکن `401` و با توکن `200`، استریم با هدر فریم `__history__` فرستاد، سفارش نمونه `ORD-9192` (= 9000 + id) دریافت کرد (ردیف‌های آزمایشی پس از بررسی حذف شدند).
- Demo Mode implemented for GitHub Pages deployment using a frontend mock interceptor (VITE_DEMO_MODE=true) and namespaced local storage session keys.
- ADR-010 پذیرفته شد: قابلیت‌های بازارک در فروشیار پلاس ادغام شدند. Field Operations، Operational Alerts و Automation به Backlog فعال افزوده شدند؛ هیچ تغییر schema/API/UI/dependency/deployment در این اقدام انجام نشده است.
- ADR-011 پذیرفته شد: نام رسمی محصول به «فروشیار پلاس / Forooshyar Plus» تغییر یافت؛ نام‌های فنی و remote فعلی بدون تغییر باقی می‌مانند.
