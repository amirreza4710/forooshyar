# فراخراسان / فروشیار — پلتفرم عملیات فروش و توزیع

## Purpose / Overview
فراخراسان یک **Sales & Distribution Operating Platform** برای مدیریت مشتریان، محصولات، سفارش‌ها، عملکرد، وصول و کنترل مدیریتی شرکت‌های پخش است. چشم‌انداز داخلی محصول، تبدیل تدریجی به **Domain-Driven Business Operating Platform** است؛ این چشم‌انداز مجوز افزودن قابلیت‌های خارج از MVP نیست.

> ⚠️ مخزن خصوصی و داخلی است. عمومی‌سازی فقط با مجوز صریح.

## Architecture / Technical Context
The implemented and authoritative repository stack is:
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Backend:** Express 5 + JWT + Pino
- **Database:** PostgreSQL + Drizzle ORM
- **API Contract:** OpenAPI → Orval → React Query + Zod

*Note: Per ADR-0001, any historical references to FastAPI or Next.js in older documents are non-authoritative.*

## Current Status

| مورد | وضعیت |
|---|---|
| Checkpoint رسمی | **1.6 — MVP Delivery Ready (Frozen)** |
| Checkpoint بعدی | **1.7 — Engineering Foundation Ready (Candidate/Blocked)** |
| MVP Scope | Frozen (11 Epics, 32 Features) |
| Current Work | Sprint 0 Target Environment Verification (Active, but Unverified) |

Sprint 0 Foundation ساخته شده، اما Checkpoint 1.7 تا اجرای موفق Frontend build، Docker Compose، Backup/Restore و Admin login/password rotation روی محیط هدف (Windows + Docker Desktop) قفل نمی‌شود.

## Scope (MVP Exclusions)
موارد زیر صریحاً خارج از MVP هستند:
- Billing Engine و Automated Invoicing
- Message Broker و Transactional Outbox
- Partner Portal و Automated Payout
- Marketplace
- Microservices
- Autonomous AI Agents

## Verification / Evidence
اسکریپت‌های عملیاتی Sprint 0 در مخزن در دسترس هستند:
- `./scripts/Initialize-Farakhorasan.ps1`
- `./scripts/Backup-Database.ps1`
- `./scripts/Restore-Database.ps1`
- `./scripts/Verify-Sprint0.ps1`

جهت تایید Sprint 0، باید این اسکریپت‌ها با موفقیت روی محیط هدف (Windows) اجرا شوند.

## Rules (Anti-Perfectionism)
- هم‌زمان فقط یک Workstream فعال است.
- Feature جدید به‌صورت پیش‌فرض Post-MVP است.
- طراحی نهایی فقط برای Sprint جاری انجام می‌شود.
- Scope Review برای حذف و کوچک‌سازی است.
- پیشرفت با Demo و Working Software سنجیده می‌شود.

## References (Start Here)
پوشه `docs/` مرجع اصلی (Canonical) است. لطفاً همیشه کار را با خواندن اسناد به ترتیب زیر آغاز کنید:
1. `PROJECT_STATE.md`
2. `AGENTS.md`
3. `README.md`
4. `docs/00_Project/governance-v2.4/README.md`
5. `docs/00_Project/Roadmap.md`
6. `docs/README.md`
