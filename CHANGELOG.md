# Changelog

## مانور عملیاتی میدانی و سناریوهای آزمون فشار بار (Load & Stress Rehearsal) — 2026-11-28

- **مانور عملیاتی و تست فشار هم‌زمانی روی سرور پیش‌نمایش (`scripts/field-load-rehearsal.mjs`):**
  - اجرای ۷۵ درخواست در ۴ سناریوی متراکم با هم‌زمانی تا ۱۰ درخواست روی سرور محلی (پورت ۳۳۰۰).
  - ۷۵ از ۷۵ درخواست با موفقیت ۱۰۰٪ و بدون خطای سرور به پایان رسید (میانه زمان پاسخ‌دهی گزارشات سنگین ۳۲۰ میلی‌ثانیه و استعلامات هیدرا ۹٫۵ میلی‌ثانیه).
- **مجموعه تست‌های استرس و رقابت هم‌زمان پایگاه داده (`field-operations.stress.test.ts`):**
  - پیاده‌سازی ۶ سناریوی استرس در `artifacts/api-server/src/routes/field-operations.stress.test.ts`:
    1. هجوم هم‌زمان ۸ ویزیتور برای ثبت ویزیت و چک‌این مکانی (تولید کدهای یکتا).
    2. رقابت هم‌زمان بر سر موجودی محدود کالا (Stock Depletion Race) و اثبات عدم منفی شدن موجودی با پاسخ ۴۰۹.
    3. کنترل سقف اعتبار مشتری تحت قفل سطری سفارشات (`FOR UPDATE`) و جلوگیری از اضافه برداشت.
    4. نهایی‌سازی هم‌زمان تحویل ناوگان همراه با اقلام مرجوعی و تایید رفتار غیرتکراری (Idempotent) با پاسخ ۴۰۹.
    5. فشار ضربتی روی پروتکل هیدرا، اثبات عملکرد کش دترمینستیک و قطع اضطراری اتمام سهمیه توکن.
    6. سنجش تأخیر و ایزولاسیون زمانی گزارش‌های سنگین تحلیلی زیر بار کوئری‌های هم‌زمان.
  - هر ۶ سناریو ۱۰۰٪ سبز و موفق.
- **تکمیل و پالایش فرانت‌اند گزارش‌ها توسط Codex (`nadraan`):**
  - حذف هشدارهای منسوخ منطقه، تثبیت بازه زمانی عملکرد در درخواست‌های کلاینت، ۱۲۵ تست پاس‌شده در فرانت‌اند.
- **شواهد جامع کیفیت در کل مونو‌ریپو:**
  - ۲۶۳ تست سرور در ۲۹ فایل (`@workspace/api-server`).
  - ۱۲۵ تست فرانت‌اند در ۱۷ فایل (`@workspace/nadraan`).
  - ۳۵ تست کتابخانه‌ها در ۴ فایل (`lib/*`).
  - مجموع ۴۲۳ تست موفق و ۱۰۰٪ سبز در کل پروژه.
  - ۰ خطای تایپ‌چک در تمام ۷ پکیج مونو‌ریپو.

## تکمیل و یکپارچه‌سازی پروتکل هیدرا (TASK-004) و لایه تصمیم‌گیری فاز A4 — 2026-11-28

- **ارتقای قراردادهای OpenAPI و تولید هوک‌های کلاینت (`Codegen`):**
  - `lib/api-spec/openapi.yaml`: تعریف اندپوینت‌های `/hydra/health`، `/hydra/intents`، `/hydra/receipts`، `/hydra/intents/{intentId}/receipt` و `/hydra/intents/{intentId}/escalate` به همراه اسکیماهای Zod و قراردادهای مناظره (`contributions` با آرای `SUPPORT`/`OPPOSE`/`AMEND`/`ABSTAIN`).
  - تعریف اندپوینت‌های گزارش‌های تحلیلی: `/reports/sales`، `/reports/visits` و `/reports/performance` با قابلیت خروجی استاندارد اکسل (`CSV UTF-8 BOM`).
  - تولید هوک‌های کلاینت در `@workspace/api-client-react`: `useGetHydraHealth`، `usePostHydraIntent`، `useGetHydraReceipts`، `useGetHydraIntentReceipt`، `useEscalateHydraIntent`، `useGetSalesReport`، `useGetVisitsReport` و `useGetPerformanceReport`.
- **سخت‌سازی و پیاده‌سازی بک‌اند (`api-server`):**
  - `artifacts/api-server/src/routes/hydra.ts`: اعمال کنترل دسترسی نقشی `requireHydraAdmin` (محدود به مدیر عامل، مدیر سیستم، admin و manager)، نرمال‌سازی خودکار شناسه‌ها و پارامترها، ذخیره در کش زنده شورا (`updateHydraReceipt`) و مسیر تصمیم قطعی ریاست (`POST /api/hydra/intents/:intentId/escalate`) به همراه ممیزی تراکنشی در جدول `audit_logs`.
  - `artifacts/api-server/src/routes/reports.ts`: محاسبه دقیق فروش ناخالص و خالص بدون خطر کسر دوباره مرجوعی، فیلتر سخت‌گیرانه منطقه (`zone`) روی کل فاکتورها، دوره‌ها و مشتریان برتر، اعمال فیلتر بازه زمانی (`from`/`to`) روی عملکرد، تطبیق نقش‌های ویزیتور و ایزولاسیون دسترسی غیرمدیران.
  - تست‌های بک‌اند: ۱۲ تست اختصاصی هیدرا و ۷ تست گزارشات (مجموعاً ۱۹ تست پاس‌شده در `hydra.test.ts` و `reports.test.ts`).
- **پیاده‌سازی فرانت‌اند توسط Codex (`nadraan`):**
  - `artifacts/nadraan/src/pages/hydra.tsx`: کنسول عملیاتی هیدرا برای ارزیابی نیت‌ها، نمایش مناظره سنا، آرای اعضا، مدیریت ارجاع انسانی و دانلود رسید با ۲۲ تست موفق.
  - `artifacts/nadraan/src/pages/reports.tsx`: صفحه جامع تحلیل‌های مدیریتی (فروش، ویزیت، لیدربورد تارگت‌ها) با فیلترهای تقویمی، تب‌های مجزا و دانلود CSV با ۲۶ تست موفق.
  - ارتقای داشبورد عملیات و سایدبار ناوبری.
- **شواهد جامع کیفیت:**
  - فرانت‌اند: ۱۲۳ تست موفق در ۱۷ فایل بدون خطا (`@workspace/nadraan`).
  - سرور: ۱۹ تست موفق در `hydra.test.ts` و `reports.test.ts` (و ۲۳۸ تست کل سرور).
  - تایپ‌چک: ۰ خطا در تمام پکیج‌های مونو‌ریپو (`pnpm run typecheck`).
  - بیلد تولیدی: ساخت ۱۰۰٪ موفق و وریفای‌شده (`nadraan` و `api-server`).
  - سرور پیش‌نمایش: فعال روی پورت ۳۳۰۰ متصل به پایگاه داده کانتینری.

## تحویل قرارداد اقلام مرجوعی سفارش و شفاف‌سازی فاکتور چاپی — 2026-11-28

- **ارتقای قرارداد OpenAPI و بک‌اند برای چاپ فاکتور تعدیل‌شده:**
  - `lib/api-spec/openapi.yaml`: افزودن فیلدهای `returnedAmount` و `returnedItems` به اسکیمای `Order`.
  - اجرای Codegen Orval برای به‌روزرسانی اسکیماهای Zod در `@workspace/api-zod` و هوک‌های React Query در `@workspace/api-client-react`.
  - `artifacts/api-server/src/routes/orders.ts`: اتصال داده‌های مرجوعی `deliveriesTable` به اندپوینت‌های `GET /orders/:id` و `GET /orders`.
  - افزودن تست در `orders.test.ts` (۱۹ تست موفق در `orders.test.ts` و ۲۳۸ تست موفق در کل سرور).
  - راه‌اندازی مجدد سرور پیش‌نمایش پورت ۳۳۰۰ و اثبات تجربی دریافت مقادیر مرجوعی برای سفارش ۳.

## تایید متقابل راند ۲ مناظره و ثبت اجماع نهایی فاز A2 و موج‌های توزیع مویرگی — 2026-11-28

- **اتمام رسمی راند دوم مناظره با اجماع دوطرفه بین Antigravity و Codex:**
  - اجرای موفق آزمون سرتاسری رابط توسط Codex روی سرور پیش‌نمایش (پورت ۳۳۰۰) و دیتابیس کانتینری (پورت ۵۵۴۳۲) در هر ۴ مسیر اصلی (وصولی، حواله توزیع، پورسانت و هشدارها).
  - تایید رفتار سرور در رد خطای ۴۰۹ تخصیص هم‌زمان و رد مرجوعی مازاد بر سفارش.
  - تایید اصلاح رابط کاربری در `OrderDetail.tsx` (توقف چاپ فاکتور در زمان تعدیل ناشی از مرجوعی و نمایش هشدار صریح) با ۷۱ تست پاس‌شده در فرانت‌اند.
  - ثبت نیازمندی تفکیک اقلام مرجوعی در قرارداد `GET /orders/{id}` در بک‌لاگ فنی.
- **شواهد جامع کیفیت مونو‌ریپو:**
  - فرانت‌اند: ۷۱ تست موفق در ۱۵ فایل (`@workspace/nadraan`).
  - سرور: ۲۳۷ تست موفق در ۲۶ فایل (`@workspace/api-server`).
  - کتابخانه‌ها: ۳۵ تست موفق در ۴ فایل (`lib/*`).
  - تایپ‌چک: صفر خطا در کل ۸ پکیج مونو‌ریپو (`pnpm run typecheck`).
  - بیلد کامل: ۱۰۰٪ موفق و وریفای‌شده (`pnpm run build`).

## رفع موانع سرور، سخت‌سازی مرجوعی و اعتبار، و اثبات محیط پیش‌نمایش جهت آزمون عملی رابط — 2026-11-28

- **سخت‌سازی بک‌اند و اعمال گاردریل‌های مالی و عملیاتی:**
  - `deliveries.ts`: استخراج قیمت مرجوعی از سفارش اصلی، تجمیع اقلام مرجوعی برای ردیف‌های تکراری، تفکیک کالای پولی و اشانتیون، قفل سطری `SELECT ... FOR UPDATE` روی حواله و سفارش برای جلوگیری از بازگشت دوباره موجودی یا کسر بدهی در نهایی‌سازی هم‌زمان، بازگشت اتمیک موجودی و بدهی، و گارد راننده.
  - `orders.ts`: انطباق قطعی محاسبه سقف اعتبار با قاعده بدهی دفتر کل ($\text{بدهی جاری} = \text{سفارش‌ها} - \text{وصولی‌های تسویه‌شده}$؛ $\text{تعهد جدید} = \text{بدهی جاری} + \text{سفارش جدید}$)، قفل سطری مشتری، آزمون دو سفارش هم‌زمان و آزمون رفتار Fail-Closed در شکست مالی.
  - `targets.ts`: فیلتر وضعیت بر پایه وضعیت محاسبه‌شده زنده (`metrics.status`)، آزمون اهداف `ACHIEVED` و `MISSED` با وضعیت دیتابیسی قدیمی، و محدودسازی داده‌های غیرمدیران.
  - `collections.ts`: آزمون رد اتصال سفارش مشتری دیگر با خطای ۴۰۰.
  - `customers.ts` و `targets.ts`: هماهنگی `canManageCustomerCredit` و `canManageTargets` برای نقش‌های سرپرست و سرپرست فروش.
- **راه‌اندازی و اثبات محیط پیش‌نمایش مجزا (Preview Environment):**
  - اجرای پایدار سرور روی پورت ۳۳۰۰ متصل به پایگاه داده کانتینری پیش‌نمایش روی پورت ۵۵۴۳۲ با اعمال اسکیما بدون بازنشانی داده‌ها.
  - اثبات دریافت پاسخ معتبر `200 OK` منطبق با قرارداد برای ۴ مسیر `/api/collections`، `/api/deliveries`، `/api/commissions/summary` و `/api/alerts/summary`.
- **شواهد تست و اعتبارسنجی:**
  - ۲۳۷ آزمون سرور پاس‌شده در ۲۶ فایل (`--fileParallelism=false`).
  - ۳۵ آزمون کتابخانه‌ها پاس‌شده در ۴ فایل.
  - ۰ خطای تایپ‌چک در کل ۸ پکیج مونو‌ریپو.
  - ساخت موفق پروژه با کد خروج ۰.
  - شواهد ۷۰ آزمون موفق فرانت‌اند در ۲۸ نوامبر متعلق به اجرای مستقل کدکس است؛ تأیید بازبین به جای کدکس ثبت نشده و وضعیت در انتظار آزمون عملی رابط است.
  - این مأموریت صرفاً رفع موانع سرور و آماده‌سازی پیش‌نمایش است و مجوزی برای ادغام یا انتشار نیست.

## تأیید همگام‌سازی آنلاین درایو — 2026-11-28

- با ورود مهندس جان در مرورگر، مانع دسترسی درایو رفع شد. [سند اصلی انتقال در پوشه مگامن](https://drive.google.com/file/d/1sIzkZYkvUnkhw4XGAI9vq8YNr4t0V0bJ/view) از مسیر مدیریت نسخه‌ها به‌روز شد؛ نسخه موازی ساخته نشد.
- الحاقیه28نوامبر شامل70آزمون موفق، بررسی نوع/ساخت، وضعیت شاخه، کدهای محلی ثبت‌نشده و موانع مالی است. بازخوانی102خط و7300نویسه دقیقاً با متن آماده برابر بود و تمام متن71خطی پیشین حفظ شد. پیام بارگذاری موفق و نسخه تازه16:16 مشاهده شد.
- گزارش‌های مسدودبودن درایو در بندهای قدیمی، تاریخچه پیش از ورود هستند؛ اکنون همگام‌سازی محتوای اسناد درایو و سه سند محلی انجام شده است. تأیید بازبین، انتشار کدهای محلی و پذیرش مالی همچنان ادعا نمی‌شوند.


## ادامه اجرا و شواهد تازه — 2026-11-28

- وظیفه مستقل بعدی اجرا شد: ثبت سفارش اکنون ردیف تهی یا فیلد نامعتبر کالا/مشتری را پیش از نمایش و محاسبه رد می‌کند؛ پیام دریافت ناموفق و توقف ثبت حفظ می‌شود. فقط هوک‌ها و انواع تولیدشده مصرف شدند؛ سرور/قرارداد تغییر نکرد.
- پیش از اصلاح، چهار آزمون تازه با خرابی ردیف تهی یا نبود خطای مورد انتظار شکست خوردند. پس از اصلاح، آزمون مستقل ثبت سفارش11/11 موفق، سپس آزمون کامل70/70 در15فایل با خروج0، شروع16:10:51 و مدت204.54ثانیه گذشت. بررسی نوع خروج0؛ ساخت با حالت نمایشی خاموش خروج0 و45.64ثانیه؛ دو هشدار توضیحات وابستگی قبلی باقی است.
- ساخت محلی تازه index-Bgjo1AkN.js و index-pPqoWZeP.css است؛ اثر انگشت ورودی9c2966f47ea00f2121ee96dcb446817677264cd0ddf48a466fc3f845e2ec4e62. موتور کانتینر Kiri در دسترس نبود؛ این ساخت در پیش‌نمایش بارگذاری/بررسی عملی نشده است.
- همگام‌سازی آنلاین اسناد شاخه جاری انجام می‌شود؛ کدهای محلی تغییرکرده همه مالکان همچنان ثبت/منتشر نشده‌اند. پذیرش بازبین و رفع موانع مالی قبلی ادعا نمی‌شود.
- درایو: اتصال مستقیم نیازمند احراز هویت؛ اتصال جایگزین منابعی دارد ولی پوشه مگامن/سند انتقال پروژه یافت نشد؛ مرورگر صفحه ورود نشان داد. همگام‌سازی درایو مسدود دسترسی مقصد باقی است. اقدام لازم: ورود معتبر یا نشانی/دسترسی سند اصلی؛ نسخه موازی ساخته نشد.


## همگام‌سازی مستندات — 2026-11-28

- رابط موج‌های مصوب A2، A2.5 و A3 پیاده‌سازی و در وضعیت READY_FOR_REVIEW (آماده بازبینی) تحویل شده است؛ تأیید بازبین یا پذیرش کامل مالی ثبت نشده است.
- تغییرات شامل ویزیت مقاوم، اتصال سفارش، اعتبار مشتری، اهداف، جزئیات و چاپ، ورودی ریال، داشبورد واقعی، وصولی، ناوگان، پورسانت و هشدار است. جزئیات و تاریخچه در [سند هماهنگی](docs/09_Development/AGENT_HANDOFF.md) محفوظ است.
- آخرین شواهد اجرای مشاهده‌شده مربوط به 2026-11-25 است: 66 آزمون در15فایل موفق، بررسی نوع و ساخت خروج0. این اعداد اجرای مجدد در28نوامبر محسوب نمی‌شوند. شواهد250آزمون سرور/کتابخانه‌ها در بخش‌های قدیمی گزارش مالک سرور است و در این همگام‌سازی دوباره تأیید نشده است.
- آخرین پیش‌نمایش بررسی‌شده http://localhost:8088 با بسته index-Dbj26h-C.js و index-pPqoWZeP.css بود؛ اثر انگشت ورودی 0e2e516c4823f8e703434b5b7e465297cddbf34b81ac9cb247236e6887b2054a. وضعیت اجرای فعلی پیش‌نمایش دوباره بررسی نشده است.
- پذیرش عملی وصول/ناوگان/پورسانت/هشدار باز است: آخرین سرور پیش‌نمایش برای چهار مسیر404 داشت. کنترل اعتبار اتمیک، تطبیق مشتری وصولی/سفارش، مرجوعی نسبت به سفارش اصلی و یکسان‌سازی نقش‌ها نیازمند رسیدگی مالک سرور است؛ کنترل رابط جایگزین امنیت سرور نیست.
- درایو: اتصال نخست احراز هویت می‌خواهد؛ اتصال جایگزین در جست‌وجوی سند انتقال و پوشه مگامن نتیجه نداد. نسخه HANDOVER_SYSTEM_TRANSFER.md به‌روز/همگام اعلام نمی‌شود.
- اقدام بعدی: بازبینی مالک، رفع نیازهای سرور و همگام‌سازی پیش‌نمایش بدون بازنشانی داده، آزمون سرتاسری مالی و سپس تکمیل نسخه درایو پس از دسترسی معتبر. همگام‌سازی اسناد به معنی تأیید یا انتشار محصول نیست.


All notable changes to this project will be documented in this file.

## Unreleased

### Added
- **Wave 1 (`Phase A2.5`) & Wave 2 (`Phase A3`) Complete Capillary Distribution Backend + OpenAPI Contracts:**
  - Accepted [`ADR-012`](docs/ADR/ADR-012.md) defining architectural contracts for cost accounting, cartoning, zone assignment, invoice discounts/bonus items, Sayyad cheque collections ledger, delivery partial returns, tiered commissions, and live executive alerts.
  - **Wave 1 (`A2.5`) Schema, OpenAPI & Route Upgrades:** Added `unitsPerPack`, `costPrice`, `minStock` on `products`; `zone`, `latitude`, `longitude` on `customers`; `assignedZone` on `users`; `subtotal`, `discount`, `paymentMethod`, `notes`, and item `isBonus` on `orders`. Added atomic stock restoration on order cancellation (`PATCH`) and soft-delete (`DELETE`), rep data isolation across orders and visits, customer zone filtering, `visit.customerId` validation, strict RBAC (`403`) on `creditLimit`/`balance` mutations, bounced-cheque order blocking, and live `grossProfit`, `pendingOrdersCount`, `lowStockCount`, `bouncedChequesCount` KPIs on `/api/dashboard/summary` with cache invalidation (`invalidateDashboardCache`).
  - **Wave 2 (`A3`) Modules:** Created `collectionsTable` and `deliveriesTable` schemas (`lib/db/src/schema/collections.ts`, `deliveries.ts`), pushed to PostgreSQL, extended `lib/api-spec/openapi.yaml` and regenerated `@workspace/api-zod` and `@workspace/api-client-react` (fixed `orval.config.ts` with `query.version: 5`). Implemented `/api/collections*` (cash/card immediate settlement, Sayyad cheques lifecycle `PENDING`/`CLEARED`/`BOUNCED`, deterministic transactional `customers.balance` ledger sync), `/api/deliveries*` (driver assignment, cartoned loading sheet `packsCount` + `remainderUnits`, transactional `PARTIAL_RETURN` with selective `restock` and balance settlement), `/api/commissions/summary` (tiered 2%/3% commission computed strictly on `CLEARED` collections), and `/api/alerts/summary` (4 live DB-fact alert categories).
  - Updated `lib/api-client-react/src/demo-mock.ts` and `demo-mock.test.ts` (14 passing client-lib tests) and authored comprehensive backend integration tests in `orders.test.ts` (15 tests), `collections.test.ts` (2 tests), `deliveries.test.ts` (1 test), `commissions.test.ts` (1 test), and `alerts.test.ts` (1 test) — totaling **250 passing tests across 41 test files** (`180` api-server, `35` nadraan, `21` api-zod, `14` api-client-react) with `pnpm run typecheck` passing with 0 errors.

- **Shared Client Demo Mock Alignment (`@workspace/api-client-react`):**
  - Updated `lib/api-client-react/src/demo-mock.ts` to cover `/api/visits`, `/api/visits/stats/summary`, `/api/targets`, `/api/targets/stats/summary`, `/api/settings`, `/api/audit-logs`, `/api/dashboard/sales-chart`, and match OpenAPI schemas (`DashboardSummary`, `Order`, `Customer`, `Product`, `User`) with currency set to `ریال` and brand `فروشیار پلاس`.
  - Added 3 unit tests in `lib/api-client-react/src/demo-mock.test.ts` (13 passing tests in `@workspace/api-client-react`, 34 total across `lib/`).
- **TASK-004-PRE: Merit-Based Model Selector Contract for Hydra ACP:**
  - Designed runtime model discovery and dispatch contracts in `@workspace/api-zod` (`model-routing.schema.ts`).
  - Added `DiscoveredModelSchema`, `HydraModelSelectionRequestSchema`, `HydraModelDispatchPlanSchema`, and `MeritFeedbackEventSchema`.
  - Implemented pure function `selectHydraModels(request)` with cost-penalized merit score formula: `meritScore = (0.6 * prior + 0.4 * empirical) - lambda * costIndex`.
  - Implemented dynamic Orchestrator selection based on weighted architecture skill (70%) and context window capacity (30%).
  - Enforced cross-family reviewer verification (`crossFamilyVerified`) for L2/L3 tiers with single-family fallback handling (`fallbackUsed: true`).
  - Added Zod `superRefine` invariant strictly blocking identical executor and reviewer model families when `crossFamilyVerified` is asserted.
  - Mapped execution dispatch to ACP Senate roles (`strategist`, `architect`, `auditor`) locked to `HYDRA_MAX_DEBATE_ROUNDS = 2`.
  - Authored comprehensive Vitest unit tests in `model-selector.test.ts` (8 tests passing, 21 total in `api-zod`).

- **Phase A2: Sales & Field Operations Core (Visits, Orders & Visitor Targets):**
  - **A2-TASK-01 (Database Schema):** Created `visitsTable` in `lib/db/src/schema/visits.ts` with GPS check-in/check-out coordinates, deterministic `code` derivation, status, result, and soft-delete support. Added foreign key `orders.visitId -> visits.id`.
  - **A2-TASK-02 (Canonical API & Codegen):** Extended `lib/api-spec/openapi.yaml` with `/visits`, `/visits/{id}`, and `/visits/stats/summary`. Generated canonical Zod validation schemas and React Query client hooks.
  - **A2-TASK-03 (API Server Routes & Integration):** Implemented Express routes in `artifacts/api-server/src/routes/visits.ts` with audit logging, zero-division safe conversion metrics, and 5 integration tests (`src/routes/visits.test.ts` passing on Kiri PostgreSQL container).
  - **A2-TASK-06 (Credit Limit Validation & Two-Way Visit Link ORD-F01..F02):** Added `creditLimit` and `balance` to `customersTable` and OpenAPI schema. Enforced customer credit ceiling in order transaction (rejecting order with 400 if pending orders + new order exceed `creditLimit`). Established two-way link updating `visitsTable.orderId = order.id` and `visitsTable.result = 'ORDERED'`. Added 2 integration tests (12 tests passing in `orders.test.ts`).
  - **A2-TASK-07 (Sales Targets Infrastructure TAR-F01..F02):** Created `targetsTable` in `lib/db/src/schema/targets.ts` with amount/quantity quotas, period dates, and status. Implemented canonical OpenAPI endpoints (`/targets`, `/targets/{id}`, `/targets/stats/summary`), Zod validation, and React Query client codegen. Implemented Express routes with role-based isolation (regular reps see only self, managers manage all), dynamic achievement tracking calculated from actual orders in target window, zero-division safe metrics, transactional audit logging, and soft-delete. Authored 7 comprehensive integration tests in `targets.test.ts` (100% passing).

- **Phase A1 Operational Foundation Completion & Codex P2 Hardening:**
  - Resolved and verified all 3 open decisions (D1 Basic Settings, D2 Self-service Password Change, D3 Audit Enabler).
  - **P2 Finding 1 Resolved (Atomic Token Issuance & Audit):** Wrapped refresh token issuance and audit log creation in `artifacts/api-server/src/routes/auth.ts` inside a single atomic Drizzle transaction `await db.transaction(async (tx) => ...)`. Added unit and stress tests verifying rollback when audit logging throws.
  - **P2 Finding 2 Resolved (SET-F02 Acceptance Scope Narrowing):** Clarified acceptance criteria in `docs/01_PRD/A1-Acceptance-Criteria.md` to scope configurable currency (`تومان`) to A1, and explicitly designated dynamic date/number formats as `POST_MVP_CANDIDATE`.
  - Hardened `POST /api/auth/change-password` route with identical-password rejection, active refresh token revocation, transactional audit logging, and Persian error messaging.
  - Added unit test in `src/routes/auth.test.ts` verifying rejection (400) when new password matches current password.
  - Verified dynamic prefix resolution from `settingsTable` (`productCodePrefix`, `customerCodePrefix`, `orderCodePrefix`) in product, customer, and order creation transactions.
  - Updated and approved `docs/01_PRD/A1-Acceptance-Criteria.md` as 100% passed and frozen.

### Added
- **TASK-003: Hydra Agent Communication Protocol (ACP) Contracts:**
  - Defined strict TypeScript 5.x contracts and Zod validation schemas in `@workspace/api-zod` (`lib/api-zod/src/hydra-acp.contract.ts`).
  - Implemented discriminated union protocol events (`HYDRA_INTENT_PROPOSED`, `HYDRA_DEBATE_ROUND_COMPLETED`, `HYDRA_EXECUTION_DECIDED`).
  - Enforced 2-round Senate debate cap invariant (`HYDRA_MAX_DEBATE_ROUNDS = 2`) and deterministic multi-tenant headers.
  - Added 13 Vitest unit tests covering envelopes, headers, debate rounds, receipts, and event schemas (`lib/api-zod/src/hydra-acp.contract.test.ts` - 100% pass).
  - Added `./hydra-acp` subpath export in `lib/api-zod/package.json` and root re-export in `lib/api-zod/src/index.ts`.
  - Added `HANDOVER.md` documentation detailing verification steps and contract signatures.

### Fixed
- **Typecheck & Monorepo Code Health (Zero-Error Baseline):**
  - Resolved TypeScript error TS2339 in `artifacts/api-server/src/routes/auth.ts` by aligning Zod error handling to `pwParsed.error.issues[0]?.message`.
  - Removed dangling table cells referencing undefined variable `o` inside the skeleton loading row in `artifacts/nadraan/src/pages/orders.tsx`.
  - Confirmed 100% clean typecheck (`pnpm run typecheck`) across all workspaces (`@workspace/api-server`, `@workspace/nadraan`, `@workspace/scripts`, and `lib/`).
- **CI Test Suite & Agent Boundary Compliance:**
  - Reverted `.github/workflows/docs.yml` to adhere strictly to `agent-microtask-gate` scope boundaries (which bans modifying `.github/` files).
  - Fixed `customFetch` in `@workspace/api-client-react` to guard demo-mock fallbacks behind `isDemo`, ensuring HTTP error statuses properly throw `ApiError`.
  - Aligned `dashboard.test.ts` in `@workspace/api-server` to mock Drizzle `db.select` instead of obsolete `db.execute`.
  - Added `localStorage` stub in `auth.test.ts` for Node 22 testing compatibility.
  - Added `PyYAML>=6.0` to `requirements.txt` to satisfy Python test suite dependencies (`test_docker_empirical.py`) in CI.

### Known issues
- The API test suite is intermittently flaky **inside the container** (roughly 3 in 10 runs): a test fails with `Test timed out` or `Hook timed out`, never with an assertion error, and the affected test moves between runs. The host and CI (which runs the suite on the runner against a service container) have been stable across 9 consecutive runs. Tracked as `OPEN-1` in `PROJECT_STATE.md`; only Sprint 0 gate 3 is affected.
- `artifacts/api-server/src/routes/orders.test.ts` and `soft-delete.test.ts` used to call `pool.end()` in `afterAll` on the module-level pool shared by every test file in a worker; that was removed.

- Closed the same code-generation defect on orders that was fixed for products and customers: `code` now derives from the row's own id (`ORD-` + `9000 + id`) inside the create transaction and is unique in the schema. The previous `9000 + count + 1` generator handed an already-used code to the next order after a hard delete, and two concurrent creates could race onto the same value; `orders.code` had no uniqueness constraint at all.
- `GET /api/notifications` answered `200` to anonymous callers, exposing customer names, order codes and totals, and `/api/notifications/stream` accepted the access token from `?token=`, which puts a live token in URLs, browser history and the nginx access log. Both endpoints now require `Authorization: Bearer`, and the notification bell reads the stream from a `fetch` response instead of `EventSource` so it can send that header.
- Fixed the API container crash. The runner stage copied `dist/` to `/app`, but `esbuild-plugin-pino` bakes absolute worker paths at build time; the logger then died with `MODULE_NOT_FOUND`. This path mismatch was the only cause of the startup crash — the `express-rate-limit` IPv6 validation is logged, not thrown.
- Hardened the login rate limiter to derive its key through `ipKeyGenerator` (independent security fix): a raw `req.ip` key let one IPv6 client rotate addresses within its own /64 to bypass the 5-attempts-per-15-minutes limit.
- Added `trust proxy = 1` to the API and `X-Real-IP` / `X-Forwarded-For` forwarding in the web container's nginx, so rate limiting and audit logs see the real caller instead of the proxy container.
- Removed the non-linux native-package overrides from `pnpm-workspace.yaml`; they left the declared target environment (Windows + Docker Desktop) unable to build or test the frontend at all. Committed `.dockerignore`, which was untracked and therefore missing from fresh-clone builds.
- Fixed `artifacts/api-server/vitest.config.ts`, which hardcoded `DATABASE_URL` and silently overrode the caller's database, making the integration suite impossible to run inside a container.
- Fixed `drizzle-kit push` on Windows, where the schema path is matched as a glob and a backslash is an escape character.
- Removed the duplicate `POST /dev/seed-admin` route and the credentials committed in the repository; `SESSION_SECRET` and `SEED_ADMIN_PASSWORD` are now required and `docker compose` fails fast without them. The previously committed password must be treated as compromised and rotated.
- Made the Sprint 0 verification script verify what it claims: `GATE-1.7-03` now runs the container test suite instead of only building the image, secrets come from `.env`, and password rotation asserts that the old password is rejected.
- Added a workspace-root `pnpm run test` and made PR validation real: CI provisions PostgreSQL, pushes the schema and runs the tests explicitly instead of passing with "No test script found".
- Added regression tests for the dev-seed route and the rate-limiter key derivation.
- Renamed the approved product to Forooshyar Plus / فروشیار پلاس; Bazarak is now the source label for integrated Field Operations and Automation capabilities.
- Added ADR-011 and renamed the canonical integration PRD without changing technical identifiers or the Git remote.
- feat(ci): add PR validation and verified baseline architecture documentation
- Added Master Specification v2.0 as the canonical navigation and traceability hub.
- Added a validation-first roadmap centered on the 30-day Paid Design Partner Pilot.
- Added accepted ADR-006 for Pricing & Revenue Architecture.
- Added accepted ADR-007 for the Partner Commercial Model.
- Added accepted ADR-008 for Event-Informed and Ledger-Based Billing.
- Extended the Business Constitution with pricing, partner, billing, feature-admission, and AI-cost governance.
- Kept Billing Engine, Subscription Management, Partner Portal, automated invoicing, and automated payouts outside the MVP.
- Added a stage-gate rule requiring previous-step verification before continuing to the next document or sprint.
- Added Business Constitution v1.0 as the first Sprint 1 core business document.
- Initialized repository documentation structure for Farakhorasan Sales OS.
