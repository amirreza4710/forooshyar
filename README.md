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

## از کجا شروع کنیم؟

1. [PROJECT_STATE.md](./PROJECT_STATE.md)
2. [AGENTS.md](./AGENTS.md)
3. [Governance v2.4](./docs/00_Project/governance-v2.4/README.md)
4. [Roadmap v2.4](./docs/00_Project/Roadmap.md)
5. [Documentation Index](./docs/README.md)

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

## پشته فنی فعلی مخزن

| لایه | تکنولوژی |
|---|---|
| Frontend موجود | React 19 + Vite 7 + TypeScript + Tailwind CSS 4 + shadcn/ui |
| Backend موجود | Express 5 + JWT + Pino |
| Database موجود | PostgreSQL + Drizzle ORM |
| API Contract | OpenAPI → Orval → React Query + Zod |
| Monorepo | pnpm workspaces |

> سند Sprint 0 مستقل، یک Foundation Candidate مبتنی بر FastAPI/Next.js را ثبت می‌کند. ادغام یا جایگزینی Stack موجود در این مخزن هنوز تصویب نشده و نیازمند تصمیم معماری جداگانه است. این اختلاف عمداً پنهان نشده است.

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

## قواعد ضد کمال‌گرایی

- هم‌زمان فقط یک Workstream فعال است.
- Feature جدید به‌صورت پیش‌فرض Post-MVP است.
- طراحی نهایی فقط برای Sprint جاری انجام می‌شود.
- Scope Review برای حذف و کوچک‌سازی است.
- پیشرفت با Demo و Working Software سنجیده می‌شود.
