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

خروجی‌ها (توی ریپو موجودن):
- [`graphify-out/graph.html`](./graphify-out/graph.html) — گراف تعاملی؛ دانلود کن و توی مرورگر باز کن (گیت‌هاب HTML رو مستقیم رندر نمی‌کنه)
- [`graphify-out/GRAPH_REPORT.md`](./graphify-out/GRAPH_REPORT.md) — گزارش متنی زیرسیستم‌ها و god nodeها

برای رفرش کردن گراف بعد از تغییرات کد (بدون نیاز به API key، فقط کد لوکال):
```bash
pnpm run graph:generate
```

---

## Roadmap کیفیت کد و امنیت

### انجام‌شده (بازبینی واقعی کد توسط Claude، جایگزین برنامه‌ی اولیه‌ی Copilot که به‌خاطر اتمام سهمیه‌ی رایگان اجرا نشد)

| اولویت | کار | PR |
|---|---|---|
| 🔴 امنیتی | حذف رمز پیش‌فرض هاردکد JWT؛ اجباری‌شدن `SESSION_SECRET` | #7 |
| 🔴 امنیتی | محدود کردن مدیریت کاربران (ساخت/ویرایش/حذف/ریست رمز) فقط به نقش‌های سرپرست و مدیر فروش | #9 |
| 🟠 ثبات API | اضافه شدن error handler سراسری (پاسخ JSON یکدست به‌جای صفحه‌ی خام Express) | #7 |
| 🟠 یکپارچگی داده | تراکنشی‌شدن ثبت سفارش + قفل ردیف (`FOR UPDATE`) + چک موجودی قبل از کم کردن | #7 |
| 🟡 یکپارچگی داده | محدود شدن وضعیت سفارش به enum بسته (به‌جای رشته‌ی آزاد) | #7 |
| ✅ | شکستن import cycle در نویگیشن (`App`/`Sidebar`/`login`/`profile`) | #1، #2 |
| ✅ | حذف `mockup-sandbox` (کد مرده و تکراری) | #3 |
| ✅ | نصب واقعی گراف کد (Graphify) در ریپو + اسکریپت رفرش | #4 |
| ✅ | رفع باگ حیاتی: دکمه‌های ویرایش/حذف روی موبایل نامرئی بودن (مشتریان/محصولات) | #5 |
| ✅ | بهبود UX صفحه‌ی ثبت سفارش (نوار ثابت موبایل، دکمه‌های استاندارد لمسی) | #2 |
| ✅ | ریست رمز عبور کاربر از پنل مدیریت (بدون نیاز به ایمیل) | #8 |

### باز — نیاز به تصمیم یا کار آینده

| اولویت | کار | چرا فعلاً باز مونده |
|---|---|---|
| متوسط | ایندکس دیتابیس (`orders.customer_id`, `orders.status`, `products.category`) | با حجم فعلی داده (تیم ۳نفره) فوریت نداره؛ وقتی حجم سفارش/گزارش‌گیری زیاد شد، بازبینی بشه |
| متوسط | soft-delete به‌جای حذف قطعی (مشتری/محصول/سفارش) | تصمیم معماریه — نیاز به migration و تغییر همه‌ی کوئری‌های مرتبط داره؛ باید امیررضا تایید کنه قبل از اجرا |
| متوسط | تست خودکار (unit/integration) | فعلاً هیچ تستی توی پروژه نیست؛ تایید صحت فقط با `tsc --noEmit` و تست دستیه — برای یه تیم کوچیک قابل قبوله، ولی قبل از اضافه‌شدن مشتری/فیچر جدید توصیه می‌شه حداقل تست‌های مسیر بحرانی (ثبت سفارش، لاگین) اضافه بشه |
| کم | rate limiting روی روت‌های لاگین (جلوگیری از حدس‌زدن رمز با brute-force) | با ۳ کاربر داخلی ریسک واقعی پایینه؛ اگه اپ عمومی‌تر شد، اولویتش بالا میره |
| کم | بازبینی سطح لاگ‌ها برای دیباگ محیط production | زیرساخت (pino) از قبل هست، فقط محتوای لاگ‌ها می‌تونه کامل‌تر بشه |

این آیتم‌ها به‌عنوان GitHub Issue هم قابل واگذاری‌ان (به Copilot Coding Agent یا مستقیم به Claude).
