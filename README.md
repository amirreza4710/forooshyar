# فراخراسان / فروشیار — پلتفرم عملیات فروش و توزیع

فراخراسان یک **Sales & Distribution Operating Platform** برای مدیریت مشتریان، محصولات، سفارش‌ها، عملکرد، وصول و کنترل مدیریتی شرکت‌های پخش است. چشم‌انداز داخلی محصول، تبدیل تدریجی به **Domain-Driven Business Operating Platform** است؛ این چشم‌انداز مجوز افزودن قابلیت‌های خارج از MVP نیست.

> ⚠️ مخزن خصوصی و داخلی است. عمومی‌سازی فقط با مجوز صریح.

## وضعیت فعلی

| مورد | وضعیت |
|---|---|
| Checkpoint رسمی | **1.6 — MVP Delivery Ready (Frozen)** |
| Checkpoint بعدی | **1.7 — Engineering Foundation Ready (Candidate)** |
| MVP Scope | Frozen |
| MVP Backlog | 11 Epic و 32 Feature |
| Feature جدید در v2.4 | صفر |
| معماری اجرایی | Modular Monolith با Bounded Contextهای روشن |
| کار جاری | Sprint 0 Target Environment Verification |
| Backend validation | Alembic PASS، Seed PASS، Compile PASS، Tests 7/7 PASS |
| MVP Development | هنوز آغاز نشده |

Sprint 0 Foundation ساخته شده، اما Checkpoint 1.7 تا اجرای موفق Frontend build، Docker Compose، Backup/Restore و Admin login/password rotation روی محیط هدف قفل نمی‌شود.

## مرجعیت اسناد (Source of Truth) و از کجا شروع کنیم؟

این فایل (root `README.md`) صرفاً یک نقطه ورود و سند راهبری است و جایگزین مستندات اصلی در پوشه `docs/` نمی‌شود. هرگونه تغییر در دامنه محصول (Scope) یا پشته فناوری (Stack) نیازمند ثبت یک Decision Record و به‌روزرسانی اسناد حاکمیتی است.

مرجعیت اسناد به شرح زیر است:
- فایل **`PROJECT_STATE.md`**: نمایانگر وضعیت عملیاتی و جاری پروژه.
- فایل **`AGENTS.md`**: تعریف‌کننده قوانین و دستورالعمل‌های اجرایی برای Agentها.
- پوشه **`docs/`**: مرجع اصلی (Canonical) برای مستندات محصول، کسب‌وکار، معماری، تجربه کاربری و توسعه.

لطفاً همیشه کار را با خواندن اسناد به ترتیب زیر آغاز کنید:

1. [PROJECT_STATE.md](./PROJECT_STATE.md)
2. [AGENTS.md](./AGENTS.md)
3. [README.md](./README.md)
4. [Governance v2.4](./docs/00_Project/governance-v2.4/README.md)
5. [Roadmap v2.4](./docs/00_Project/Roadmap.md)
6. [Documentation Index](./docs/README.md)

ترتیب حاکمیت:

```text
Business Constitution
→ Accepted Decision Records
→ Master Specification
→ MVP Scope
→ Checkpoint 1.6
→ Frozen MVP Backlog
→ Roadmap
→ Sprint Artifacts and Code
```

## محدوده MVP

Epicهای متعهد:

1. Authentication & Access
2. Role-Based Dashboard
3. Customers
4. Products & Pricing
5. Orders
6. Targets
7. KPI
8. Commission
9. Collections
10. Reports
11. Basic Settings

موارد خارج از MVP:

- Billing Engine و Automated Invoicing
- Message Broker و Transactional Outbox
- Partner Portal و Automated Payout
- Marketplace
- Microservices
- Autonomous AI Agents

## پشته فنی فعلی مخزن (Stack Divergence Warning)

پشته (Stack) پیاده‌سازی شده و قطعی در این مخزن به شرح زیر است:
| لایه | تکنولوژی |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS 4 + shadcn/ui |
| Backend | Express 5 + JWT + Pino |
| Database | PostgreSQL + Drizzle ORM |
| API Contract | OpenAPI → Orval → React Query + Zod |

> **هشدار مهم:** هرگونه ارجاع تاریخی یا خارجی به `FastAPI` یا `Next.js` در مستندات، غیررسمی و منسوخ تلقی می‌شود، مگر آنکه با یک Decision Record جدید در آینده تصویب گردد. در حال حاضر، هیچ‌گونه مهاجرت، ادغام، جایگزینی یا تغییر در این پشته (Stack) تایید نشده است. تمام Agentها موظفند اجرای فعلی مخزن و مستندات حاکمیتی کنونی را به‌عنوان تنها مرجع معتبر بشناسند. هر تغییر آینده در پشته باید از طریق ثبت یک Decision Record انجام شده و به‌طور همزمان در اسناد `README`، `PROJECT_STATE`، `AGENTS`، `Roadmap` و `docs/README` به‌روزرسانی شود.

## راه‌اندازی مخزن موجود

```bash
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
pnpm --filter nadraan run dev
```

بررسی:

```bash
pnpm run typecheck
pnpm run build
```

## Sprint 0 Freeze Gate

برای ارتقای Candidate به Checkpoint 1.7 باید روی محیط هدف ثبت شود:

- Frontend production build
- Docker Compose runtime verification
- Backend tests inside container
- Health/Readiness checks
- PostgreSQL backup/restore
- Seed Admin login
- Admin password rotation

اسکریپت‌های عملیاتی Sprint 0 در مخزن در دسترس هستند (تأیید شده):
- `./scripts/Initialize-Farakhorasan.ps1`
- `./scripts/Backup-Database.ps1`
- `./scripts/Restore-Database.ps1`
- `./scripts/Verify-Sprint0.ps1`

جهت تایید Sprint 0 باید این اسکریپت‌ها مطابق راهنمای موجود در `PROJECT_STATE.md` با موفقیت روی محیط هدف اجرا شوند.

## قواعد ضد کمال‌گرایی

- هم‌زمان فقط یک Workstream فعال است.
- Feature جدید به‌صورت پیش‌فرض Post-MVP است.
- طراحی نهایی فقط برای Sprint جاری انجام می‌شود.
- Scope Review برای حذف و کوچک‌سازی است.
- پیشرفت با Demo و Working Software سنجیده می‌شود.
