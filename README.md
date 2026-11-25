<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0B0F19,50:0A84FF,100:00F0FF&height=200&section=header&text=Forooshyar%20Plus&fontSize=56&fontColor=ffffff&fontAlignY=38&desc=Sales%20%26%20Distribution%20Operating%20Platform%20%7C%20Powered%20by%20Hydra%20ACP&descAlignY=58&descSize=16" alt="Forooshyar Plus Banner" width="100%" />

  <p>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-00F0FF.svg?style=flat-square" alt="License: MIT" /></a>
    <img src="https://img.shields.io/badge/Stack-React%2019%20%7C%20Express%205%20%7C%20Drizzle%20ORM-0A84FF.svg?style=flat-square" alt="Tech Stack" />
    <a href="https://github.com/amirreza4710/forooshyar-core"><img src="https://img.shields.io/badge/Core-forooshyar--core-00F0FF.svg?style=flat-square" alt="Forooshyar Core" /></a>
  </p>
</div>

# فروشیار پلاس — پلتفرم عملیات فروش و توزیع

فروشیار پلاس یک **Sales & Distribution Operating Platform** برای مدیریت عملیات میدانی، مشتریان، محصولات، سفارش‌ها، وصول و کنترل مدیریتی شرکت‌های پخش است. قابلیت‌های بازارک در لایه‌های Field Operations و Automation این محصول ادغام شده‌اند. چشم‌انداز داخلی محصول، تبدیل تدریجی به **Domain-Driven Business Operating Platform** است؛ این چشم‌انداز مجوز افزودن قابلیت‌های خارج از MVP نیست.

## وضعیت فعلی

| مورد | وضعیت |
|---|---|
| Checkpoint رسمی | **A1 — Operational Foundation (Approved & Frozen)** |
| Checkpoint فعال | **A2 — Sales & Field Core (Visits, Orders Credit Link, Targets)** |
| MVP Scope | Frozen |
| MVP Backlog فعال | 14 Epic و 41 Feature |
| Frozen baseline | v2.4: 11 Epic و 32 Feature |
| معماری اجرایی | Modular Monolith با Bounded Contextهای روشن + Hydra ACP (`forooshyar-core`) |
| کار جاری | Phase A2 (Sales & Field Core) + `TASK-004` (Hydra Senate Engine) |

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
12. Field Operations
13. Operational Alerts
14. Automation

موارد خارج از MVP:

- Billing Engine و Automated Invoicing
- Message Broker و Transactional Outbox
- Partner Portal و Automated Payout
- Marketplace
- Microservices
- Autonomous AI Agents

## پشته فنی فعلی مخزن (Architecture / Technical Context)

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
pnpm run test
```

> `pnpm run test` شامل تست‌های integration است و به یک PostgreSQL در دسترس نیاز دارد؛ بدون `DATABASE_URL` عمداً شکست می‌خورد تا تست‌ها بی‌صدا رد نشوند.

## اجرای محلی با Docker (محیط پذیرش)

```bash
cp .env.example .env    # سپس SESSION_SECRET و SEED_ADMIN_PASSWORD را پر کنید
pnpm install
docker compose up --build
```

- وب: `http://localhost` — API از مسیر داخلی `http://localhost/api/...` (پراکسی Nginx داخل سرویس `web`) و `http://localhost:3000/api/...` برای اجرای مستقیم اسکریپت‌ها.
- `SESSION_SECRET` و `SEED_ADMIN_PASSWORD` اجباری‌اند و در مخزن هیچ مقدار پیش‌فرضی ندارند؛ `docker compose` بدون `.env` با پیام واضح متوقف می‌شود.
- تست‌ها با دیتابیس کانتینری:

```bash
docker compose up -d
pnpm --filter @workspace/db run push
pnpm run test
```

### توپولوژی ثابت‌شده (عمدی)

| سرویس | انتشار روی هاست | دلیل |
|---|---|---|
| `web` | `0.0.0.0:80` | تنها سرویس عمومی؛ Nginx هم SPA را سرو می‌کند و هم `/api` را پروکسی می‌کند |
| `api` | `127.0.0.1:3000` | اسکریپت‌های Sprint 0 (health، login) مستقیماً از روی هاست به آن نیاز دارند |
| `db` | `127.0.0.1:5432` | `drizzle-kit push` و تست‌های integration از روی هاست به آن نیاز دارند |

`api` و `db` فقط روی loopback منتشر می‌شوند، نه روی شبکهٔ بیرونی. برای استقرار تولیدی (Coolify) یک Compose جدا ساخته می‌شود که در آن فقط `web` عمومی است.

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
