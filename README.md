# فروشیار | نادران‌گستر — پلتفرم مدیریت پخش و فروش

سیستم مدیریت سفارش و ویزیتوری برای شرکت پخش نادران‌گستر. ویزیتورهای فیلد سفارش ثبت می‌کنن، مدیر پخش از داشبورد وضعیت مشتری/محصول/سفارش رو کنترل می‌کنه.

> ⚠️ **Private repo — کدهای داخلی نادران‌گستر.** بدون اجازه‌ی صریح، این ریپو رو public نکنید.

---

## Stack

| لایه | تکنولوژی |
|---|---|
| Frontend | React 19 + Vite 7 + TypeScript + Tailwind CSS 4 + shadcn/ui (Radix) + Wouter + Recharts |
| Backend | Express 5 + JWT auth (bcryptjs) + Pino logging |
| Database | PostgreSQL + Drizzle ORM |
| API Contract | OpenAPI (`lib/api-spec`) → Orval codegen → React Query hooks + Zod schemas |
| Monorepo | pnpm workspaces |
| Package manager | **فقط pnpm** — نصب با npm/yarn عمداً block شده (`preinstall` script) |

---

## ساختار پروژه

```
artifacts/
  api-server/       بک‌اند Express — routes, auth, business logic
  nadraan/           فرانت‌اند اصلی (production)

lib/
  db/                اسکیمای Drizzle + migrations (customers, orders, products, users)
  api-spec/          OpenAPI spec — منبع حقیقت برای API
  api-zod/           تایپ‌ها و اسکیمای Zod تولیدشده از OpenAPI
  api-client-react/  React Query hooks تولیدشده (Orval) + لایه‌ی fetch سفارشی

scripts/             اسکریپت‌های کمکی (seed دیتابیس و غیره)
```

### صفحات اصلی (`artifacts/nadraan/src/pages`)
`login` · `dashboard` · `new-order` · `orders` · `products` · `customers` · `users` · `profile`

### Routeهای بک‌اند (`artifacts/api-server/src/routes`)
`auth` · `customers` · `products` · `orders` · `dashboard` · `notifications` · `users` · `health`

### جداول دیتابیس (`lib/db/src/schema`)
`customers` · `orders` · `products` · `users`

---

## راه‌اندازی محلی

```bash
# ۱. نصب (فقط pnpm)
pnpm install

# ۲. اتصال به دیتابیس — یه .env با DATABASE_URL بساز (نمونه‌ی .env در ریپو نیست، از drizzle.config.ts چک کن)
pnpm --filter @workspace/db run push        # اعمال اسکیما روی دیتابیس

# ۳. اجرای بک‌اند (build + start)
pnpm --filter @workspace/api-server run dev

# ۴. اجرای فرانت (در ترمینال جدا)
pnpm --filter nadraan run dev
```

### دستورات سطح ریشه
```bash
pnpm run typecheck   # typecheck کل مونوریپو
pnpm run build        # build کامل (بعد از typecheck)
```

### تولید مجدد API Client بعد از تغییر OpenAPI Spec
تغییر در `lib/api-spec` باید با Orval دوباره codegen بشه تا `lib/api-client-react` و `lib/api-zod` sync بمونن (جزئیات دقیق دستور رو در `lib/api-spec/orval.config.ts` ببین).

---

## نکات معماری مهم برای توسعه‌دهنده‌ی بعدی

- **API contract-first:** هر تغییر در API باید از `lib/api-spec` (OpenAPI) شروع بشه، نه مستقیم از route یا hook.
- **Known issue — Import cycle:** بین `App.tsx → AppLayout.tsx → Sidebar.tsx → App.tsx` یه وابستگی حلقوی وجود داره که باید در یه رفکتور جدا شکسته بشه (به `GRAPH_REPORT.md` مراجعه کن).

---

## نقشه‌ی کد (Codebase Map)

این ریپو با [Graphify](https://github.com/Graphify-Labs/graphify) نقشه‌برداری شده — یه knowledge graph از کل کدبیس (۱۸۰۹ نود، ۲۶۱۷ یال، ۲۲۷ زیرسیستم شناسایی‌شده) که نشون می‌ده کدوم فایل‌ها به کدوم وصلن، کدوم توابع "hub" هستن، و کجا وابستگی حلقوی یا کد تکراری وجود داره.

خروجی‌ها (اگه به ریپو اضافه شدن):
- `graphify-out/graph.html` — گراف تعاملی، قابل باز کردن در مرورگر
- `graphify-out/GRAPH_REPORT.md` — گزارش متنی زیرسیستم‌ها و god nodeها

برای رفرش کردن گراف بعد از تغییرات کد (بدون نیاز به API key، فقط کد لوکال):
```bash
pip install graphifyy
graphify extract . --code-only --no-cluster
graphify cluster-only . --no-label
```

---

## Roadmap کیفیت کد (بر اساس تحلیل Graphify)

| اولویت | کار | وضعیت |
|---|---|---|
| بالا | شکستن import cycle در نویگیشن (`App`/`AppLayout`/`Sidebar`) | باز |
| متوسط | بررسی extract کردن UI kit مشترک به یه پکیج workspace جدا (`@workspace/ui`) | باز |

این آیتم‌ها به‌عنوان GitHub Issue برای Copilot Coding Agent هم قابل واگذاری‌ان.
