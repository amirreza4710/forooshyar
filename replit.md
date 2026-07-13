# نادران‌گستر | پلتفرم مدیریت پخش

یک پلتفرم مدیریت پخش و فروش برای شرکت‌های FMCG — نمایندگان فروش از آن برای ثبت سفارش در فروشگاه‌های مشتریان استفاده می‌کنند و مدیران همه چیز را از داشبورد رصد می‌کنند.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/nadraan run dev` — React frontend (port 26158, proxied at /)
- `pnpm --filter @workspace/scripts run seed` — seed initial users/customers/products
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, Tailwind CSS 4, Wouter, Recharts, Radix UI
- API: Express 5 + JWT auth (bcryptjs)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec → React Query hooks)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, customers, products, orders)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks + TS types
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/nadraan/src/pages/` — all 8 app pages (login, dashboard, new-order, orders, products, customers, users, profile)
- `artifacts/nadraan/src/components/layout/` — AppLayout + Sidebar

## Architecture decisions

- JWT stored in localStorage as `nadraan_token`; injected via `setAuthTokenGetter` from api-client-react
- Dark mode default (class-based on `<html>`), toggled via localStorage `nadraan_theme`
- RTL layout (`dir="rtl"`, `lang="fa"`) set on `<html>` at app boot in main.tsx
- Vazirmatn font loaded from CDN (fontsource)
- Orders create decrements product stock atomically via SQL

## Product

- **Login** — username/password with quick-fill buttons for demo users
- **Dashboard** — KPI cards (total sales, orders, customers, products) + Recharts bar chart (7-day sales) + recent orders
- **ثبت سفارش** — product grid with emoji icons, category filter, search, cart panel with qty controls, customer selector
- **لیست سفارشات** — sortable/filterable table with inline status change dropdown
- **محصولات** — product CRUD with add/edit modals and stock color-coding
- **مشتریان** — customer CRUD with avatar initials
- **تیم فروش** — user management with role badges
- **پروفایل** — personal sales stats for logged-in rep

## Demo accounts

- کاربران: امیررضا / امیرمحمد / حسام
- رمز عبور همه: 1234

## User preferences

- تمام متون UI باید به فارسی باشد
- Dark mode به عنوان پیش‌فرض
- فونت Vazirmatn برای همه متون

## Gotchas

- Always import API hooks from `@workspace/api-client-react`, never relative paths
- `db.execute()` returns `{ rows: [...] }` — destructure `.rows`, do NOT spread as array
- Dashboard uses Drizzle's `count()` and `sum()` helpers, not raw SQL count
- After mutations, invalidate via `queryKey` helpers (e.g. `getListProductsQueryKey()`)

## Pointers

- See `pnpm-workspace` skill for workspace structure
- OpenAPI spec → codegen → hooks pipeline documented in `.local/skills/pnpm-workspace/references/openapi.md`
