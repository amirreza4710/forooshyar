# فراخراسان / فروشیار — پلتفرم عملیات فروش و توزیع

فراخراسان یک **Sales & Distribution Operating Platform** برای مدیریت عملیات فروش میدانی، مشتریان، محصولات، سفارش‌ها و کنترل مدیریتی شرکت‌های پخش است. پیاده‌سازی فعلی با هویت «فروشیار / نادران‌گستر» چرخه عملیاتی موجود را پوشش می‌دهد؛ نام نهایی عمومی محصول هنوز یک تصمیم باز است.

> ⚠️ **Private repository — کد و مستندات داخلی.** این مخزن را بدون مجوز صریح عمومی نکنید.

---

## وضعیت فعلی پروژه

| مورد | وضعیت |
|---|---|
| فاز | Sprint 1 — Core Business Documentation |
| مدل توسعه | Documentation-first و Contract-first |
| موقعیت فعلی بازار | Sales & Distribution Operating Platform |
| چشم‌انداز داخلی | Domain-Driven Business Operating Platform |
| معماری اجرایی هدف | Modular Monolith با Bounded Contextهای روشن |
| مدل تجاری اولیه | 30-Day Paid Design Partner Pilot |
| Checkpoint فعلی | 1.1 — بازبینی Master Specification v2.0 |
| وضعیت PRD | تا تصویب Checkpoint 1.1 مسدود |
| Billing Engine و Partner Portal | خارج از MVP سی‌روزه |

PR #22 ادغام شده و Pricing Constitution، Master Specification v2.0، Roadmap و ADRهای 006 تا 008 اکنون در شاخه `main` موجودند. ادغام این اسناد به‌معنای تصویب کامل Master Specification یا Business Constitution نیست؛ وضعیت هر دو همچنان **Draft for Sprint 1 review** است.

### تصمیم‌های پذیرفته‌شده

- [ADR-006 — Pricing & Revenue Architecture](./docs/ADR/ADR-006.md)
- [ADR-007 — Partner Commercial Model](./docs/ADR/ADR-007.md)
- [ADR-008 — Event-Informed and Ledger-Based Billing](./docs/ADR/ADR-008.md)
- Billable Seat از Role و RBAC مستقل است.
- AI، API، پیامک، واتساپ، تماس و ایمیل به‌عنوان Metered Services مدیریت می‌شوند.
- صورتحساب MVP دستی است و باید Auditable Usage Export داشته باشد.
- Billing Engine، Subscription Management، Partner Portal، Automated Invoicing و Automated Payout خارج از MVP هستند.
- قابلیت‌های جدید باید از Feature Admission Gate عبور کنند: ارزش قابل‌اندازه‌گیری، استفاده مجدد، اقتصاد پایدار و هم‌راستایی با Constitution.

---

## از کجا شروع کنیم؟

برای جلوگیری از تعارض یا تکرار مشخصات، این ترتیب را دنبال کنید:

1. [PROJECT_STATE.md](./PROJECT_STATE.md) — وضعیت کوتاه‌مدت و گام بعدی
2. [AGENTS.md](./AGENTS.md) — قواعد کار انسان و عامل‌های هوش مصنوعی
3. [Business Constitution v1.0](./docs/02_Business/Business-Constitution-v1.0.md) — اصول و مرزهای تجاری
4. [Master Specification v2.0](./docs/00_Project/Master-Specification-v2.0.md) — مرکز ناوبری، مالکیت و ردیابی
5. [Product Roadmap](./docs/00_Project/Roadmap.md) — توالی اعتبارسنجی و Stage Gateها
6. [Documentation Index](./docs/README.md) — فهرست کامل اسناد

ترتیب Source of Truth:

```text
Business Constitution
→ Accepted ADRs
→ Master Specification
→ Roadmap
→ PRD
→ Domain & Architecture
→ Implementation Contracts
→ Operations Evidence
```

یک سند پایین‌دستی نمی‌تواند بدون Change Log و تصمیم رسمی، سند بالادستی را بازنویسی کند.

---

## پشته فنی

| لایه | تکنولوژی |
|---|---|
| Frontend | React 19 + Vite 7 + TypeScript + Tailwind CSS 4 + shadcn/ui (Radix) + Wouter + Recharts |
| Backend | Express 5 + JWT auth (bcryptjs) + Pino logging |
| Database | PostgreSQL + Drizzle ORM |
| API Contract | OpenAPI (`lib/api-spec`) → Orval codegen → React Query hooks + Zod schemas |
| Monorepo | pnpm workspaces |
| Package manager | **فقط pnpm**؛ نصب با npm/yarn توسط `preinstall` مسدود است |

---

## ساختار پروژه

```text
artifacts/
  api-server/       بک‌اند Express: route، auth و business logic
  nadraan/          فرانت‌اند اصلی

lib/
  db/               schema و migrationهای Drizzle
  api-spec/         قرارداد OpenAPI و منبع حقیقت API
  api-zod/          type و schemaهای Zod تولیدشده
  api-client-react/ React Query hookهای تولیدشده با Orval

docs/
  00_Project/       Master Specification، Roadmap و حاکمیت پروژه
  01_PRD/           نیازمندی‌های محصول؛ فعلاً برنامه‌ریزی‌شده
  02_Business/      Business Constitution
  ADR/              Architecture Decision Recordها
  ...               اسناد دامنه، معماری، AI و توسعه در مراحل بعد

scripts/            اسکریپت‌های کمکی
```

### صفحات اصلی

`login` · `dashboard` · `new-order` · `orders` · `products` · `customers` · `users` · `profile`

مسیر: `artifacts/nadraan/src/pages`

### Routeهای بک‌اند

`auth` · `customers` · `products` · `orders` · `dashboard` · `notifications` · `users` · `health`

مسیر: `artifacts/api-server/src/routes`

### جداول فعلی دیتابیس

`customers` · `orders` · `products` · `users`

مسیر: `lib/db/src/schema`

موجودیت‌های Subscription، Plan، PriceBook، Billable Seat، Metered Service، Usage Ledger و Partner فعلاً مفاهیم رزروشده آینده‌اند و حضورشان در اسناد، مجوز پیاده‌سازی در MVP نیست.

---

## راه‌اندازی محلی

پیش‌نیازها: Node.js، pnpm و PostgreSQL.

```bash
# 1) نصب وابستگی‌ها
pnpm install

# 2) تنظیم DATABASE_URL در فایل .env و اعمال schema
pnpm --filter @workspace/db run push

# 3) اجرای backend
pnpm --filter @workspace/api-server run dev

# 4) اجرای frontend در ترمینال جداگانه
pnpm --filter nadraan run dev
```

### بررسی پروژه

```bash
pnpm run typecheck
pnpm run build
```

### تولید مجدد API Client

هر تغییر API باید ابتدا در `lib/api-spec` اعمال شود. سپس Orval باید اجرا شود تا `lib/api-client-react` و `lib/api-zod` همگام بمانند. تنظیمات در `lib/api-spec/orval.config.ts` قرار دارد.

---

## اصول معماری

- **Contract-first API:** تغییر API از OpenAPI آغاز می‌شود، نه از route یا hook.
- **Documentation-first:** تصمیم‌های تجاری و معماری ابتدا در مالک canonical خود ثبت می‌شوند.
- **Modular Monolith first:** مهاجرت به Microservices فقط با محرک اندازه‌گیری‌شده و ADR جدید مجاز است.
- **Billing separation:** صورتحساب از RBAC مستقل و در آینده Event-Informed و Ledger-Based خواهد بود.
- **MVP discipline:** سازگاری آینده طراحی می‌شود، اما زیرساخت زودهنگام Billing و Partner ساخته نمی‌شود.
- **Auditable rules:** قیمت، تخفیف، کمیسیون، Rule، Policy و Metered Usage باید نسخه‌پذیر و قابل‌ممیزی باشند.

---

## نقشه کد

مخزن با [Graphify](https://github.com/Graphify-Labs/graphify) نقشه‌برداری شده است:

- [گراف تعاملی](./graphify-out/graph.html) — پس از دانلود در مرورگر باز شود.
- [گزارش ساختار و وابستگی‌ها](./graphify-out/GRAPH_REPORT.md)

برای بازتولید نقشه پس از تغییرات کد:

```bash
pnpm run graph:generate
```

---

## وضعیت کیفیت و امنیت

### انجام‌شده

| حوزه | نتیجه | PR |
|---|---|---|
| امنیت | حذف JWT secret پیش‌فرض و اجباری‌شدن `SESSION_SECRET` | #7 |
| مجوزها | محدودکردن مدیریت کاربران به نقش‌های مجاز | #9 |
| پایداری API | Error handler سراسری با پاسخ JSON یکدست | #7 |
| یکپارچگی داده | ثبت تراکنشی سفارش، قفل ردیف و کنترل موجودی | #7 |
| یکپارچگی داده | محدودکردن وضعیت سفارش به enum بسته | #7 |
| معماری frontend | شکستن import cycle در navigation | #1، #2 |
| نگهداری | حذف `mockup-sandbox` | #3 |
| تحلیل کد | افزودن Graphify و اسکریپت بازتولید | #4 |
| UX | اصلاح عملیات ویرایش/حذف در موبایل | #5 |
| UX | بهبود ثبت سفارش در موبایل | #2 |
| مدیریت کاربران | ریست رمز عبور از پنل مدیریت | #8 |
| آزمون | تست خودکار مسیر بحرانی ثبت سفارش | #11 |
| عملکرد | ایندکس‌های دیتابیس متناسب با queryهای واقعی | #12 |

### باز و نیازمند تصمیم

| اولویت | موضوع | شرط اقدام |
|---|---|---|
| متوسط | Soft Delete برای مشتری، محصول و سفارش | ADR/طراحی migration و تأیید صریح پیش از اجرا |
| کم | Rate Limiting برای login | افزایش سطح دسترسی عمومی یا ریسک Brute Force |
| کم | بازبینی Logging در Production | تعریف نیازهای Observability و داده‌های مجاز |

---

## گام بعدی

Checkpoint 1.1 باید Master Specification v2.0 را از نظر سلسله‌مراتب اسناد، مرز MVP، ردیابی ADRهای 006 تا 008 و مالکیت تصمیم‌ها تأیید یا اصلاح کند. تا پیش از این تأیید، PRD آغاز نمی‌شود.
