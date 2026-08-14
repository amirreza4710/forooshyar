# PROJECT_STATE.md

این فایل حافظه کوتاه‌مدت و نقطه شروع مخزن است. هر انسان یا Agent باید پیش از بارگذاری اسناد عمیق‌تر، این فایل را بخواند.

## Current State

- **Project:** Farakhorasan Sales OS / فروشیار
- **Market Position:** Sales & Distribution Operating Platform
- **Internal Vision:** Domain-Driven Business Operating Platform
- **Architecture:** Modular Monolith با Bounded Contextهای روشن
- **Current Official Checkpoint:** **1.6 — MVP Delivery Ready (Approved & Frozen)**
- **Next Checkpoint:** **1.7 — Engineering Foundation Ready (Candidate, Not Frozen)**
- **Current Workstream:** Sprint 0 target-environment verification
- **MVP Scope:** Frozen
- **MVP Backlog:** 11 Epic و 32 Feature متعهد
- **New Features Added in v2.4:** صفر
- **Status:** ENGINEERING FOUNDATION RELEASE CANDIDATE

## What Is Frozen

- Business و Product Foundation
- Product Constitution و تصمیم‌های تجاری/معماری پذیرفته‌شده
- Domain، API، Database و UX baselines
- MVP 30-Day Scope
- Feature Admission Audit
- MVP Backlog و Cut Line
- Checkpoint 1.6

## Sprint 0 Evidence

- Repository و Branch/PR policy
- Modular Monolith package boundaries
- Migration baseline
- Authentication foundation
- Audit minimum
- API/Error conventions
- Structured logging و Request ID
- Health/Readiness endpoints
- Seed data
- CI definition
- Backup/Restore scripts
- Sprint 1 Board

Backend validation ثبت‌شده:

```text
Alembic: PASS
Seed: PASS
Compile: PASS
Tests: 7/7 PASS
```

## Remaining Gate Before Checkpoint 1.7 Freeze

این موارد باید روی Windows + Docker Desktop اجرا و ثبت شوند:

1. Frontend production build
2. Docker Compose build/up
3. Backend tests داخل Container
4. Health و Readiness از Host
5. PostgreSQL backup
6. PostgreSQL restore test
7. Seed Admin login
8. Admin password rotation

تا عبور از این Gate، Checkpoint رسمی پروژه **1.6** باقی می‌ماند.

## Explicitly Outside MVP

- Billing Engine و Automated Rating/Invoice/Reconciliation
- Message Broker و Transactional Outbox
- Partner Portal و Delegated Tenant Access UI
- Automated Partner Commission/Payout
- Marketplace
- Microservices decomposition
- Autonomous AI Agents

## Current Execution Sequence

```text
Checkpoint 1.6
→ Sprint 0 Target Verification
→ Checkpoint 1.7 Freeze
→ Sprint 1: AUTH + Settings + Products + Customers
→ Sales Core
→ Performance & Cash
→ Decision Layer
→ Stabilization
```

## Mandatory Next Action

روی محیط هدف اجرا شود:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\Initialize-Farakhorasan.ps1
.\scripts\Backup-Database.ps1
$LatestBackup = Get-ChildItem .\backups\*.dump | Sort-Object LastWriteTime -Descending | Select-Object -First 1
.\scripts\Restore-Database.ps1 -BackupFile $LatestBackup.FullName
.\scripts\Verify-Sprint0.ps1
```

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
