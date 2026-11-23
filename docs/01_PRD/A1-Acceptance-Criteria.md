# A1 — Operational Foundation: Acceptance Criteria

**Status:** APPROVED & FROZEN (PASSED)
**Date:** 2026-11-23
**Scope:** `AUTH-F01..F03`, `SET-F01..F03`, `PRD-F01..F03`, `CUS-F01..F03` + `AUD-ENABLER` (12 features + Audit Enabler, frozen cut line)

## Why this file exists

`docs/00_Project/Roadmap.md` and `PROJECT_STATE.md` name the A1 feature IDs, and `MVP_FEATURE_ADMISSION_AND_BACKLOG.md` lists them as the Sprint 1 cut line. This document formalizes the definition of done and acceptance criteria for all 12 operational features of Checkpoint A1, recording empirical verification evidence for freezing the operational foundation.

## Exit gate (canonical, verbatim)

> کاربر مجاز بتواند وارد شود، تنظیمات پایه، محصول و مشتری معتبر ایجاد کند و عملیات حساس Audit شوند.

## Definition of done (from `docs/01_PRD/FOROOSHYAR_PLUS_INTEGRATION.md`)

> Every slice is done only when type-safe, validated, tested, OpenAPI-aligned where applicable, auditable, and usable with error states.

## Feature map (All Gates Passed)

| ID | Definition | Acceptance criteria | Status | Evidence |
|---|---|---|---|---|
| AUTH-F01 | ورود و مدیریت نشست | ورود با اعتبار معتبر توکن دسترسی کوتاه‌عمر + refresh token برمی‌گرداند؛ رمز اشتباه `401` است و رمز در هیچ logی ثبت نمی‌شود؛ refresh چرخشی است و توکن باطل‌شده قابل استفاده نیست؛ محدودیت تلاش ورود بر پایهٔ IP واقعی کارفرما اعمال می‌شود | IMPLEMENTED | `src/routes/auth.test.ts` (11 تست)، `src/lib/auth.test.ts` (9 تست)، گیت‌های ۷ و ۸ در `Verify-Sprint0` |
| AUTH-F02 | کاربران و نقش‌ها | فقط نقش‌های مدیریتی کاربر می‌سازند/ویرایش/حذف می‌کنند؛ کاربر غیرمجاز `403` می‌گیرد؛ رمز ضعیف `400` است؛ حذف کاربر soft-delete است و کاربر حذف‌شده نمی‌تواند وارد شود | IMPLEMENTED | `src/routes/users.test.ts` (3 تست) + `requireRole` روی همهٔ mutationها |
| AUTH-F03 | پروفایل و تغییر رمز خودِ کاربر | کاربر بتواند پروفایل خودش را ببیند و رمز خودش را با تأیید رمز فعلی عوض کند؛ پس از تغییر، رمز قبلی رد شود و تمام refresh tokenهای فعال باطل شوند؛ رمز جدید با رمز فعلی یکسان نباشد | IMPLEMENTED | `POST /api/auth/change-password` در `src/routes/auth.ts`، `src/routes/auth.test.ts` (۴ تست اختصاصی تغییر رمز)، دیالوگ تغییر رمز در `src/pages/profile.tsx` با اعتبارسنجی فارسی |
| SET-F01 | هویت کسب‌وکار | نام سازمان/پخش، تلفن و آدرس به‌صورت سروری ذخیره و برای کاربر مجاز قابل خواندن باشد | IMPLEMENTED | جدول `settings` در DB، اندپوینت‌های `GET /api/settings` و `PUT /api/settings` با گارد RBAC در `src/routes/settings.ts`، `settings.test.ts` (۵ تست) |
| SET-F02 | پیش‌فرض‌های واحد و نمایش | واحد پول و قالب نمایش اعداد/تاریخ یکبار تنظیم و در همهٔ صفحه‌ها همان مقدار استفاده شود | IMPLEMENTED | ستون `currency` در `settingsTable`، مقدار پیش‌فرض «تومان»، نمایش در داشبورد و سفارشات |
| SET-F03 | کلیدهای شماره‌گذاری اسناد | پیشوند کد محصول/مشتری/سفارش از تنظیمات خوانده شود؛ کد تولیدشده یکتا و از `id` ردیف مشتق شود | IMPLEMENTED | ستون‌های `productCodePrefix`, `customerCodePrefix`, `orderCodePrefix` در `settingsTable`؛ خواندن داینامیک از طریق `getOrCreateSettings(tx)` در روت‌های `products.ts`, `customers.ts`, `orders.ts` |
| PRD-F01 | ایجاد محصول | محصول با `name/category/price/stock` معتبر ساخته شود؛ فیلد ناقص `400`؛ `code` یکتا، مشتق از `id` و پیشوند داینامیک تنظیمات باشد؛ `code` پس از حذف قطعی یک ردیف دوباره استفاده نشود | IMPLEMENTED | `src/routes/products.test.ts` (5 تست) + قید دیتابیسی یکتایی |
| PRD-F02 | ویرایش محصول | ویرایش فقط روی رکورد غیرحذف‌شده اعمال شود؛ رکورد حذف‌شده `404`؛ `code` قابل تغییر توسط کاربر نباشد | IMPLEMENTED | `src/routes/products.ts` (`isNull(deletedAt)` در همهٔ mutationها)، قرارداد `ProductUpdate` بدون `code` |
| PRD-F03 | حذف محصول و اثر آن | حذف، soft-delete باشد؛ محصول حذف‌شده در سفارش جدید قابل استفاده نباشد (`400`) و سابقهٔ سفارش‌های قبلی دست‌نخورده بماند | IMPLEMENTED | `src/routes/soft-delete.test.ts` |
| CUS-F01 | ایجاد مشتری | مشتری با `name/phone` معتبر ساخته شود؛ فیلد ناقص `400`؛ `code` یکتا، مشتق از `id` و پیشوند داینامیک تنظیمات باشد؛ `code` پس از حذف قطعی یک ردیف دوباره استفاده نشود | IMPLEMENTED | `src/routes/customers.test.ts` (5 تست) + قید یکتایی |
| CUS-F02 | ویرایش مشتری | ویرایش فقط روی رکورد غیرحذف‌شده؛ رکورد حذف‌شده `404`؛ `code` قابل تغییر نباشد | IMPLEMENTED | `src/routes/customers.ts` + قرارداد `CustomerUpdate` |
| CUS-F03 | حذف مشتری و اثر آن | حذف، soft-delete باشد؛ مشتری سفارش‌دار حذفش پذیر است و از لیست بیرون می‌رود بدون خطای کلید خارجی؛ دادهٔ مالی حذف نمی‌شود | IMPLEMENTED | `src/routes/soft-delete.test.ts` |
| AUD-ENABLER | ثبت و ممیزی عملیات حساس | هر عملیات حساس (ورود موفق/ناموفق، ایجاد/ویرایش/حذف کاربر، تغییر نقش یا رمز، ایجاد/ویرایش/حذف محصول، مشتری، سفارش و تنظیمات) یک رکورد فقط-افزودنی با actor، action، entity، entityId، IP و زمان ثبت کند؛ رکورد در همان تراکنش عمل نوشته شود؛ هیچ رمز/توکن/secret در آن نباشد؛ فقط نقش مدیریتی آن را بخواند | IMPLEMENTED | جدول `audit_logs` در DB، تابع کمکی `logAudit` مبتنی بر تراکنش Drizzle، اندپوینت `GET /api/audit-logs` در `src/routes/audit.ts`، `src/routes/audit.test.ts` (۳ تست)، پنل بازبینی زنده در مرکز عملیات `team.tsx` |

## Resolved Decisions

- **D1 — محتوای «تنظیمات پایه»:** تصویب و پیاده‌سازی شد. جدول `settings` شامل نام کسب‌وکار، تلفن، آدرس، واحد پول (تومان) و پیشوندهای سه‌گانه شماره‌گذاری (`NG-`, `C-`, `ORD-`) است که توسط روت‌های کسب‌وکار به صورت تراکنشی خوانده می‌شوند.
- **D2 — تغییر رمز توسط خود کاربر:** تصویب و پیاده‌سازی شد. روت `POST /api/auth/change-password` همراه با اعتبارسنجی رمز فعلی، اعتبارسنجی قدرت رمز جدید، ابطال فوری توکن‌های رفرش قبلی، منع انتخاب رمز جدید مشابه رمز فعلی، و کامپوننت مودال در فرانت‌اند مستقر شد.
- **D3 — Audit Enabler:** تصویب و پیاده‌سازی شد. جدول فقط-افزودنی `audit_logs` به همراه ثبت رخدادهای حساس در روت‌های Auth, Users, Products, Customers, Orders, Settings فعال شد و از طریق RBAC محافظت می‌شود.

## Phase A1 Exit Gate Status

**GATE RESULT: 100% PASSED & FROZEN.**
کاربر مجاز می‌تواند وارد سیستم شود، تنظیمات پایه، محصول و مشتری معتبر ایجاد و ویرایش کند، رمز عبور خود را به صورت امن تغییر دهد و تمامی رخدادهای حساس در جدول Audit ثبت و ممیزی می‌شوند.
