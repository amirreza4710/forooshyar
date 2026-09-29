# A1 — Operational Foundation: Acceptance Criteria

**Status:** Draft — needs owner sign-off (PM/BA) on the three open decisions in the last section.
**Date:** 2026-09-29
**Scope:** `AUTH-F01..F03`, `SET-F01..F03`, `PRD-F01..F03`, `CUS-F01..F03` (12 features, frozen cut line)

## Why this file exists

`docs/00_Project/Roadmap.md` and `PROJECT_STATE.md` name the A1 feature IDs, and `MVP_FEATURE_ADMISSION_AND_BACKLOG.md` lists them as the Sprint 1 cut line, but no document defined what each feature *is* or when it is accepted. `docs/01_PRD/README.md` names `PRD.md` and `Acceptance-Criteria.md` as planned files; neither existed.

Governance requires an accepted scope, acceptance criteria, and architecture impact before implementation. A1 is admitted (`ACTIVE`), so this file does not add scope: it makes the existing scope testable.

## Exit gate (canonical, verbatim)

> کاربر مجاز بتواند وارد شود، تنظیمات پایه، محصول و مشتری معتبر ایجاد کند و عملیات حساس Audit شوند.

## Definition of done (from `docs/01_PRD/FOROOSHYAR_PLUS_INTEGRATION.md`)

> Every slice is done only when type-safe, validated, tested, OpenAPI-aligned where applicable, auditable, and usable with error states.

Each criterion below is written so it can be checked by a test, a script run, or a recorded command output.

## Feature map

| ID | Definition | Acceptance criteria | Status | Evidence |
|---|---|---|---|---|
| AUTH-F01 | ورود و مدیریت نشست | ورود با اعتبار معتبر توکن دسترسی کوتاهعمر + refresh token برمیگرداند؛ رمز اشتباه `401` است و رمز در هیچ logی ثبت نمیشود؛ refresh چرخشی است و توکن باطلشده قابل استفاده نیست؛ محدودیت تلاش ورود بر پایهٔ IP واقعی کارفرما اعمال میشود، نه IP پروکسی | IMPLEMENTED | `src/routes/auth.test.ts` (6 تست)، `src/lib/auth.test.ts` (11 تست)، گیتهای ۷ و ۸ در `Verify-Sprint0` |
| AUTH-F02 | کاربران و نقشها | فقط نقشهای مدیریتی کاربر میسازند/ویرایش/حذف میکنند؛ کاربر غیرمجاز `403` میگیرد؛ رمز ضعیف `400` است؛ حذف کاربر soft-delete است و کاربر حذفشده نمیتواند وارد شود | IMPLEMENTED | `src/routes/users.test.ts` (3 تست) + `requireRole` روی همهٔ mutationها |
| AUTH-F03 | پروفایل و تغییر رمز | کاربر بتواند پروفایل خودش را ببیند و رمز خودش را با تأیید رمز فعلی عوض کند؛ پس از تغییر، رمز قبلی رد شود | **PARTIAL** | دیدن پروفایل (`GET /auth/me`) و بازنشانی رمز توسط مدیر موجود است؛ `profile.tsx` فقط نمایشی است و تغییر رمز خودِ کاربر وجود ندارد → تصمیم D2 |
| SET-F01 | هویت کسبوکار | نام سازمان/پخش، تلفن و آدرس بهصورت سروری ذخیره و برای کاربر مجاز قابل خواندن باشد | **MISSING** | هیچ route/table/pageی وجود ندارد → تصمیم D1 |
| SET-F02 | پیشفرضهای واحد و نمایش | واحد پول و قالب نمایش اعداد/تاریخ یکبار تنظیم و در همهٔ صفحهها همان مقدار استفاده شود (نه مقادیر پراکنده در UI) | **MISSING** | → تصمیم D1 |
| SET-F03 | کلیدهای شمارهگذاری اسناد | پیشوند کد محصول/مشتری/سفارش از تنظیمات خوانده شود؛ کد تولیدشده یکتا و از `id` ردیف مشتق شود | **PARTIAL** | کدها الان یکتا و مشتق از `id` هستند، ولی پیشوندها (`NG-`, `C-`) در کد مسیر ثابتاند → تصمیم D1 |
| PRD-F01 | ایجاد محصول | محصول با `name/category/price/stock` معتبر ساخته شود؛ فیلد ناقص `400`؛ `code` یکتا و مشتق از `id` باشد؛ `code` پس از حذف قطعی یک ردیف دوباره استفاده نشود | IMPLEMENTED | `src/routes/products.test.ts` (5 تست) — نقص تولید کد در همین A1 رفع شد |
| PRD-F02 | ویرایش محصول | ویرایش فقط روی رکورد غیرحذفشده اعمال شود؛ رکورد حذفشده `404`؛ `code` قابل تغییر توسط کاربر نباشد | IMPLEMENTED | `src/routes/products.ts` (`isNull(deletedAt)` در همهٔ mutationها)، قرارداد `ProductUpdate` بدون `code` |
| PRD-F03 | حذف محصول و اثر آن | حذف، soft-delete باشد؛ محصول حذفشده در سفارش جدید قابل استفاده نباشد (`400`) و سابقهٔ سفارشهای قبلی دستنخورده بماند | IMPLEMENTED | `src/routes/soft-delete.test.ts` |
| CUS-F01 | ایجاد مشتری | مشتری با `name/phone` معتبر ساخته شود؛ فیلد ناقص `400`؛ `code` یکتا و مشتق از `id` باشد؛ `code` پس از حذف قطعی یک ردیف دوباره استفاده نشود | IMPLEMENTED | `src/routes/customers.test.ts` (5 تست) — نقص تولید کد در همین A1 رفع شد |
| CUS-F02 | ویرایش مشتری | ویرایش فقط روی رکورد غیرحذفشده؛ رکورد حذفشده `404`؛ `code` قابل تغییر نباشد | IMPLEMENTED | `src/routes/customers.ts` + قرارداد `CustomerUpdate` |
| CUS-F03 | حذف مشتری و اثر آن | حذف، soft-delete باشد؛ مشتری سفارشدار حذفش پذیر است و از لیست بیرون میرود بدون خطای کلید خارجی؛ دادهٔ مالی حذف نمیشود | IMPLEMENTED | `src/routes/soft-delete.test.ts` |
| AUD-ENABLER | ثبت عملیات حساس (cross-cutting + شرط صریح exit gate) | هر عملیات حساس (ورود موفق/ناموفق، ایجاد/ویرایش/حذف کاربر، تغییر نقش یا رمز، ایجاد/ویرایش/حذف محصول و مشتری) یک رکورد فقط-افزودنی با actor، action، entity، entityId، IP و زمان ثبت کند؛ رکورد در همان تراکنش عمل نوشته شود؛ هیچ رمز/توکن/secret در آن نباشد؛ فقط نقش مدیریتی آن را بخواند | **MISSING** | هیچ جدول/routeی وجود ندارد. با اینکه `PROJECT_STATE.md` «Audit minimum» را در فهرست تکمیلشدههای Checkpoint 1.6 آورده، در کد اثری از آن نیست → تصمیم D3 |

## Open decisions (blocking the missing rows)

- **D1 — محتوای «تنظیمات پایه».** پیشنهاد کمینه بر پایهٔ آنچه امروز در کد ثابت است: `SET-F01` هویت کسبوکار، `SET-F02` واحد پول/قالب نمایش، `SET-F03` پیشوندهای شمارهگذاری (که امروز `NG-` و `C-` در route هاردکد شدهاند). هر افزایش دیگری خارج از A1 است. **نیازمند تأیید مالک محصول.**
- **D2 — تغییر رمز توسط خود کاربر.** الان فقط نقش مدیریتی میتواند رمز را عوض کند و صفحهٔ پروفایل صرفاً نمایشی است. یا `AUTH-F03` شامل تغییر رمز خودِ کاربر میشود (نیازمند یک route و پذیرش اعتبارسنجی رمز فعلی)، یا صریحاً `POST_MVP_CANDIDATE` ثبت میشود. **نیازمند تصمیم.**
- **D3 — Audit.** بر پایهٔ `MVP_FEATURE_ADMISSION_AND_BACKLOG.md`، Audit از مسیر «Architecture Enabler Exception» با ریسک، مالک، بودجه، تاریخ بازبینی و معیار خروج مستند وارد MVP میشود. پیشنهاد: یک enabler زمانبندیشده در A1 (جدول append-only + نوشتن در همان تراکنش + route فقط-مدیریتی)، با تاریخ بازبینی در پایان A1 و معیار خروج «هر عملیات حساس در فهرست بالا رکورد دارد». **نیازمند ثبت رسمی این استثنا.**

## Explicit non-goals for A1

- multi-tenancy / `organization_id` یا هر تغییر access-control — نیازمند ADR پذیرفتهشده و Scope Review.
- قابلیتهای Bazarak (ویزیت، هشدار، اتوماسیون) — A2 و A3.
- داشبورد و گزارشهای تحلیلی — A4.
- Billing، Marketplace، Microservices، Autonomous Agents — خارج از MVP.
