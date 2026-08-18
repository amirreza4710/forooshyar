# وضعیت پروژه — فروشیار

> این فایل Operational Status (وضعیت اجرایی) پروژه است. هر Agent باید قبل از شروع کار آن را بخواند و بعد از هر اقدام مهم، وضعیت خود را با **What changed / Evidence / Remaining blockers / Next action** به‌روزرسانی کند. اگر چیزی واقعاً اجرا نشده، مقدار آن `PENDING` یا `UNVERIFIED` است، نه `PASS`.

**آخرین آپدیت:** ۱۸ اوت ۲۰۲۶ — وضعیت بازتنظیم‌شده بر اساس Repository `main`

---

## 1. خلاصه اجرایی

فروشیار در وضعیت **Checkpoint 1.6 — MVP Delivery Ready (Approved & Frozen)** قرار دارد.

Sprint 0 از نظر Repository و Artifactهای Foundation به وضعیت **Release Candidate** رسیده، اما Target Environment Verification هنوز به‌صورت کامل اثبات نشده است.

بنابراین:

> **Checkpoint 1.7 هنوز Frozen نیست و توسعه Featureهای Sprint 1 فعلاً متوقف است.**

Workstream فعال فقط:

`S0 — Target Environment Verification`

---

## 2. آنچه اجرا/تکمیل شده است

### A0 — Engineering Foundation

| آیتم | وضعیت | توضیح |
|---|---|---|
| Repository / Branch / PR policy | DONE | Governance و AGENTS موجود |
| Modular Monolith boundaries | DONE | Package boundaries و Architecture Graph ثبت شده |
| PostgreSQL + Drizzle baseline | DONE | Stack authoritative |
| Authentication foundation | DONE | Foundation موجود |
| API/Error conventions | DONE | در baseline ثبت شده |
| Audit minimum | DONE | Foundation موجود |
| Structured logging / Request ID | DONE | Pino + request context |
| Health / Readiness | DONE | Endpointها موجود |
| Seed foundation | DONE | Seed artifact موجود |
| CI minimum | DONE | PR validation workflow موجود |
| Docker Compose | DONE | db/api/web تعریف شده |
| API Dockerfile | DONE | موجود |
| Web Dockerfile | DONE | موجود |
| Backup script | DONE | موجود |
| Restore script | DONE | موجود |
| Sprint 0 Verify script | DONE | موجود، ولی پوشش Gate کامل نیست |

### Checkpoint 1.6

**APPROVED & FROZEN**

MVP Scope، Cut Line، Domain/API/DB/UX baselines و 11 Epic / 32 Feature متعهد شده‌اند.

---

## 3. Gateهای باقی‌مانده برای Checkpoint 1.7

| ID | Gate | Status | Evidence مورد نیاز | Owner |
|---|---|---|---|---|
| GATE-1.7-01 | Frontend production build | PENDING | build موفق روی Target Environment | DevOps + Frontend |
| GATE-1.7-02 | Docker Compose build/up | PENDING | compose runtime واقعی | DevOps |
| GATE-1.7-03 | Backend tests inside container | PENDING | test output داخل container | QA + Backend + DevOps |
| GATE-1.7-04 | Host Health/Readiness | PENDING | curl/browser/PowerShell evidence از Host | DevOps + QA |
| GATE-1.7-05 | PostgreSQL backup | PENDING | backup artifact واقعی | DevOps |
| GATE-1.7-06 | PostgreSQL restore | PENDING | restore + integrity assertion | DevOps + QA |
| GATE-1.7-07 | Seed Admin login | PENDING | login واقعی موفق | Backend + QA |
| GATE-1.7-08 | Admin password rotation | PENDING | new password PASS / old password FAIL | Backend + QA |

**Gate Rule:** وجود Script یا کد، Evidence اجرای واقعی نیست.

---

## 4. مشکلات و تناقضات باقی‌مانده

### BLOCKER-01 — Target Environment هنوز Verify نشده

محیط هدف Windows + Docker Desktop باید واقعاً اجرا شود. این مهم‌ترین Blocker فعلی است.

### BLOCKER-02 — `Verify-Sprint0.ps1` پوشش کامل Gate را ندارد

Script فعلی Health/Readiness و Backend test را بررسی می‌کند، اما Login، Password Rotation و Backup/Restore را به‌صورت مستقل به‌عنوان Assertion کامل Verify نمی‌کند.

**تصمیم:** قبل از Freeze نهایی 1.7، Verification باید با Evidence مستقل تکمیل شود. اگر لازم شد Script اصلاح شود، فقط برای Gate Verification و بدون افزودن Feature محصولی.

### BLOCKER-03 — Soft-delete روی DB واقعی هنوز باید اثبات شود

Code/Schema شامل `deleted_at` است، اما وضعیت Target/Dev DB واقعی فقط با اتصال واقعی و query read-only قابل اثبات است.

### DOC-01 — برخی گزارش‌های تاریخی stale هستند

`ISSUES_AND_IMPROVEMENTS.md` بخش‌هایی دارد که Docker/Compose و Scriptهای Sprint 0 را missing گزارش می‌کند، در حالی که Repository فعلی آن‌ها را دارد. این سند باید به‌عنوان Historical Audit تفسیر شود، نه Current State.

### DOC-02 — عبارت تاریخی `Alembic: PASS`

Stack رسمی Drizzle است. عبارت Alembic در بعضی گزارش‌های قدیمی Evidence معتبر Checkpoint 1.7 محسوب نمی‌شود.

---

## 5. Roadmap اجرایی ۳۰ روزه

### Phase S0 — Target Environment Verification
**Current / Active**

هدف: تبدیل Foundation Release Candidate به Engineering Foundation Verified.

خروجی: ۸ Gate پاس + Evidence ثبت‌شده + Checkpoint 1.7 Frozen.

### Phase A1 — Operational Foundation | Days 4–10

- AUTH-F01..F03
- SET-F01..F03
- PRD-F01..F03
- CUS-F01..F03

Exit Gate: login، settings، product، customer و audit minimum به‌صورت عملیاتی.

### Phase A2 — Sales Core | Days 11–18

- ORD-F01..F03
- TAR-F01..F02

Exit Gate: Customer → Order → Target Achievement End-to-End.

### Phase A3 — Performance & Cash | Days 19–24

- KPI-F01..F03
- COM-F01..F03
- COL-F01..F03

Exit Gate: KPI/Commission traceable و Collections تا ثبت پرداخت.

### Phase A4 — Decision Layer | Days 25–27

- DASH-F01..F03
- REP-F01..F03

Exit Gate: Dashboard/Reports عملیاتی با RBAC.

### Phase A5 — Stabilization | Days 28–30

- Critical/High bug fixes
- Permission review
- Backup/Restore final verification
- Data integrity checks
- Mobile/Desktop smoke test
- Release notes
- Runbook
- Controlled demo

### Phase DP — Design Partner Pilot

بعد از MVP Release:

- یک سازمان
- حداکثر ۶ کاربر میدانی
- فرآیند راه‌اندازی
- مهاجرت داده اولیه
- آموزش
- Dashboard
- KPI قبل/بعد
- ROI measurement

هدف: اثبات Customer Value، نه صرفاً تحویل نرم‌افزار.

---

## 6. وضعیت فازها

| Phase | Status | Next Transition |
|---|---|---|
| 1.6 MVP Delivery Ready | FROZEN | — |
| S0 Target Verification | ACTIVE | پاس شدن ۸ Gate |
| 1.7 Engineering Foundation Ready | BLOCKED | Freeze بعد از S0 |
| A1 Operational Foundation | NOT STARTED | بعد از 1.7 |
| A2 Sales Core | NOT STARTED | بعد از A1 |
| A3 Performance & Cash | NOT STARTED | بعد از A2 |
| A4 Decision Layer | NOT STARTED | بعد از A3 |
| A5 Stabilization | NOT STARTED | بعد از A4 |
| Design Partner | NOT STARTED | بعد از MVP Release |

---

## 7. Agent Ownership و قرارداد وضعیت

| Agent | مالکیت اصلی | در S0 چه می‌کند؟ |
|---|---|---|
| PM | Scope / milestone / prioritization | Gate tracking و جلوگیری از scope creep |
| BA | Business rules / acceptance | تعریف assertionهای کسب‌وکاری لازم |
| UX | flows / usability | فعلاً فقط در صورت blocker |
| System Architect | architecture / ADR | جلوگیری از تغییر معماری بدون ADR |
| Backend | API / domain / persistence | رفع blockerهای Auth/DB در صورت اثبات نیاز |
| Frontend | UI / integration | production build و blockerهای build |
| QA | testing / acceptance | طراحی و اجرای acceptance evidence |
| DevOps | environment / Docker / backup | مالک اصلی S0 execution |
| AI Architect | AI governance | خارج از S0 مگر task مصوب |

### قرارداد اجباری هر Agent

پس از هر Task مهم، این چهار مورد را در `PROJECT_STATUS.md` ثبت کند:

```text
What changed:
Evidence:
Remaining blockers:
Next action:
```

اگر Task فقط بررسی بوده است، هیچ کدی به‌عنوان Completed اعلام نشود.
اگر تست اجرا نشده است، `UNVERIFIED` ثبت شود.
اگر محیط واقعی در دسترس نبوده است، `TARGET ENVIRONMENT NOT VERIFIED` ثبت شود.

---

## 8. قوانین پیشرفت

1. فقط یک Workstream فعال.
2. تا Freeze شدن 1.7 هیچ Feature محصولی شروع نمی‌شود.
3. Feature جدید پیش‌فرض `POST_MVP_CANDIDATE` است.
4. Scope Review فقط برای حذف/کوچک‌سازی.
5. هر تغییر معماری نیازمند ADR.
6. Working Software و Evidence بر تعداد سند مقدم است.
7. هیچ Agent مجاز نیست وضعیت را بدون Evidence از `PENDING/UNVERIFIED` به `PASS/DONE` تبدیل کند.
8. بعد از هر Merge مهم، Graph و وضعیت پروژه باید بازبینی شوند.

---

## 9. Next Action — تنها اقدام فعال

**S0 Target Environment Verification**

ترتیب پیشنهادی:

```text
1. Preflight Windows/Docker/Node/pnpm
2. Frontend production build
3. Docker Compose build
4. Docker Compose up
5. Backend tests inside container
6. Host Health + Readiness
7. PostgreSQL backup
8. PostgreSQL restore + integrity assertion
9. Seed Admin login
10. Admin password rotation
11. Soft-delete DB read-only verification
12. Evidence capture
13. Update PROJECT_STATE / PROJECT_STATUS
14. Freeze Checkpoint 1.7 only if all gates PASS
```

هیچ اقدام محصولی موازی با این Workstream مجاز نیست.
