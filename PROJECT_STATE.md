# PROJECT_STATE.md

## فاز A5: اصلاح واحد کالا و بسته بندی در فاکتور حرارتی (FMCG Packaging & Pack Format) — 2026-11-29

- **وضعیت مأموریت:** ✅ APPROVED (اجرای ضربتی گزینه ۱ توسط Antigravity با استثنای مصوب مهندس جان بر قفل مسیر).
- **دستاوردهای قالب‌بندی بسته بندی در فاکتور:**
  - **قرارداد OpenAPI و Codegen:** افزودن فیلدهای `pack` (واحد بسته‌بندی: کارتن، جعبه، بسته، عدد) و `unitsPerPack` (ضریب بسته بندی) به `OrderItem` و `ReturnedItem` در `openapi.yaml` و اجرای Orval Codegen.
  - **سریالایز هوشمند در بک‌اند (`orders.ts`):** استخراج خودکار مشخصات بسته‌بندی از جدول کالاها (`productsTable`) در ثبت سفارش (`POST /orders`)، بازیابی جزئیات سفارش (`GET /orders/:id`) و فهرست سفارش‌ها (`GET /orders`) همراه با اقلام مرجوعی ناوگان.
  - **فرمت‌دهی استاندارد در رابط کاربری (`OrderDetail.tsx`):** پیاده‌سازی تابع `formatItemQuantity` جهت تمایز کالای تک‌محصولی (`۱ عدد`) از کالای کارتنی/جعبه‌ای (`۱ کارتن (۲۴ عددی)` و تفکیک خرد `۱ کارتن + ۲ عدد خرد (۲۴ عددی)`).
- **شواهد جامع کیفیت:**
  - فرانت‌اند: ۱۶ تست واحد سبز در `OrderDetail.test.tsx` و بیلد Vite با موفقیت کامل (`✓ built in 11.79s`).
  - سرور: ۲۰ تست واحد و یکپارچه‌سازی سبز در `orders.test.ts`.
  - تایپ‌چک: ۰ خطا در کل ۷ پکیج مونو‌ریپو (`pnpm run typecheck`).
- **اقدام بعدی:** کامیت و ارسال به شاخه `main` با تایید مهندس جان.

## فاز A5: چاپ فاکتور تعدیل‌شده و قالب حرارتی ۸۰ میلی‌متری و رفع ۸ یافته بازبینی — 2026-11-28

- **وضعیت مأموریت:** ✅ APPROVED (تأیید متقابل دو ایجنت Antigravity و Codex بر پایه پروتکل هیدرا و اجرای کامل آزمون‌ها).
- **دستاوردهای چاپ فاکتور تعدیل‌شده و بهینه‌سازی حرارتی (`Phase A5 Thermal Printing`):**
  - **قالب چاپ حرارتی ۸۰ میلی‌متری (`OrderDetail.css` & `OrderDetail.tsx`):** چیدمان فشرده تک‌ستونه ۸۰mm، پنهان‌سازی دکمه‌ها و عناصر کنترلی در چاپ (`@media print`)، استخراج اقلام مرجوعی (`returnedItems`) و نمایش مبالغ تسویه‌شده و نهایی.
  - **اطلاعات کامل مشتری:** نمایش تلفن و آدرس مشتری در هدر رسید چاپی جهت تسهیل تحویل میدانی توسط راننده/موزع.
  - **رفع قفل چاپ و گاردریل دفاعی مالی:** چاپ در صورت تطبیق مالی (`unexplainedDiff === 0`) آزاد بوده و در صورت عدم تطبیق اقلام مرجوعی با مبلغ کل مرجوعی، هشدار ناهمگونی مالی نمایش داده می‌شود.
- **رفع کامل ۸ یافته بازبینی کدکس (`Ponytail Review Resolutions`):**
  1. *حفاظت نشست:* حذف مقدار حساس `SESSION_SECRET` از اسکریپت رزمایش بار و چرخش کلید نشست به مقدار ایمن.
  2. *ایزولاسیون تننت هیدرا:* فیلتر سخت‌گیرانه رسیدها با `tenantId` در `getRecentHydraReceipts`.
  3. *جلوگیری از دستکاری نیت:* محاسبه هش دترمینستیک SHA-256 و صدور خطای ۴۰۹ در صورت دستکاری نیت‌های ثبت‌شده.
  4. *سخت‌سازی مسیر ارجاع ریاست:* بازگرداندن ۴۰۴ برای نیت ناموجود و ۴۰۰ برای نیت‌های خارج از وضعیت `ESCALATED`، به همراه ثبت تراکنشی در `audit_logs`.
  5. *تطبیق نقش‌ها:* افزودن عناوین فارسی «ویزیتور / نماینده فروش» و «موزع / راننده» به فهرست نقش‌های مجاز گزارشات.
  6. *محاسبه پورسانت بدون تارگت:* تطبیق نرخ پایه ۲٪ و اصلاح بازه زمانی تداخل دوره‌ها در گزارشات.
  7. *تسهیم تخفیف در مرجوعی:* محاسبه قیمت موثر اقلام بر اساس نسبت کل فاکتور به جمع جزء، جلوگیری از کسر دوباره تخفیف و اعمال سقف قیمت.
  8. *کنترل هجوم هم‌زمان رزمایش:* اجرای دسته‌ای و ترتیبی سناریوهای بار جهت جلوگیری از اشباع پورت ویندوز.
- **شواهد جامع کیفیت:**
  - فرانت‌اند: ۱۴ تست اختصاصی `OrderDetail.test.tsx` پاس‌شده و بیلد تولیدی ۱۰۰٪ موفق کلاینت (`@workspace/nadraan`).
  - سرور: ۳۳ تست پاس‌شده در روت‌های مرجوعی، سفارشات و گزارشات (`@workspace/api-server`) و ۱۴ تست سبز هیدرا.
  - کتابخانه‌ها: ۳۵ تست پاس‌شده در ۴ فایل (`lib/*`).
  - تایپ‌چک: ۰ خطا در تمام ۷ پکیج مونو‌ریپو (`pnpm run typecheck`).
  - بیلد کامل: بیلد کلاینت و سرور ۱۰۰٪ موفق.
- **اقدام بعدی:** کامیت و ارسال به شاخه `main` با تایید مهندس جان.

## مانور عملیاتی میدانی و سناریوهای آزمون فشار بار (Load & Stress Rehearsal) — 2026-11-28

- **وضعیت مأموریت:** ✅ APPROVED (تأیید کامل سناریوهای مانور فشار بار میدانی و پالایش نهایی فرانت‌اند گزارشات).
- **دستاوردهای تست فشار بار و هم‌زمانی:**
  - **مانور زنده روی سرور پیش‌نمایش (`scripts/field-load-rehearsal.mjs`):** ۷۵ استعلام هم‌زمان در ۴ سناریو (سلامت سرور، گزارشات سنگین، عملیات ناوگان و شورا/سنای هیدرا) با نرخ موفقیت ۱۰۰٪ و زمان پاسخ‌دهی میانگین زیر ۳۰۰ میلی‌ثانیه برای گزارشات تحلیلی.
  - **آزمون‌های استرس سطحی پایگاه داده (`field-operations.stress.test.ts`):** اثبات ایزولاسیون تراکنشی، قفل‌های سطری (`FOR UPDATE`)، عدم منفی شدن موجودی کالا در خریدهای هم‌زمان، رعایت سقف اعتبار مشتری، عدم ثبت مضاعف اقلام مرجوعی ناوگان، و پایداری پروتکل هیدرا با سقف ۲ راند مناظره.
- **شواهد جامع کیفیت:**
  - فرانت‌اند: ۱۲۵ تست موفق در ۱۷ فایل بدون خطا (`@workspace/nadraan`).
  - سرور: ۲۶۳ تست موفق در ۲۹ فایل (`@workspace/api-server`).
  - کتابخانه‌ها: ۳۵ تست موفق در ۴ فایل (`lib/*`).
  - کل تست‌های مونو‌ریپو: ۴۲۳ تست ۱۰۰٪ سبز.
  - تایپ‌چک: ۰ خطا در تمام ۷ پکیج مونو‌ریپو (`pnpm run typecheck`).
  - بیلد تولیدی: ساخت کامل و موفق (`pnpm run build`).
- **اقدام بعدی:** کامیت و ارسال به شاخه `main` با تایید مهندس جان و ورود به فاز A5 (اتصال چاپگر حرکتی/همراه و پرینت فاکتور تعدیل‌شده).

## تکمیل و یکپارچه‌سازی پروتکل هیدرا (TASK-004) و لایه تصمیم‌گیری فاز A4 — 2026-11-28

- **وضعیت مأموریت:** ✅ APPROVED (تأیید متقابل دو ایجنت Antigravity و Codex مطابق با پروتکل هیدرا).
- **تغییرات کلیدی بک‌اند، قراردادها و فرانت‌اند:**
  - **قراردادهای OpenAPI و Codegen:** اندپوینت‌های `/hydra/*` و `/reports/*` به `openapi.yaml` اضافه شد و هوک‌های React Query کلاینت تولید گردید.
  - **موتور و کنسول هیدرا (`TASK-004`):** موتور مناظره سنا با سقف ۲ راند، فیوز قطع جریان تکراری، گارد دسترسی مدیریتی `requireHydraAdmin`، مسیر ارجاع تصمیم انسانی `POST /api/hydra/intents/:intentId/escalate` و کنسول کاربری در `artifacts/nadraan/src/pages/hydra.tsx` با ۲۲ تست فرانت و ۱۲ تست سرور سبز.
  - **لایه تصمیم‌گیری و گزارش‌های فاز A4 (`PHASE-A4`):** اندپوینت‌های `/reports/sales`، `/reports/visits` و `/reports/performance` با خروجی استاندارد اکسل (`CSV UTF-8 BOM`)، فیلتر منطقه، جلوگیری از کسر دوباره مرجوعی، فیلتر بازه زمانی عملکرد و کنترل دسترسی نقشی پیاده شد. صفحه فرانت‌اند `reports.tsx` و داشبورد عملیات با ۲۶ تست فرانت و ۷ تست سرور سبز.
- **شواهد جامع کیفیت:**
  - فرانت‌اند: ۱۲۳ تست موفق در ۱۷ فایل بدون خطا (`@workspace/nadraan`).
  - سرور: ۱۹ تست موفق در `hydra.test.ts` و `reports.test.ts` (و ۲۳۸ تست کل سرور).
  - تایپ‌چک: ۰ خطا در تمام ۷ پکیج مونو‌ریپو (`pnpm run typecheck`).
  - بیلد کامل: ۱۰۰٪ موفق و وریفای‌شده (`pnpm run build`).
  - سرور پیش‌نمایش: فعال روی پورت ۳۳۰۰ متصل به پایگاه داده کانتینری.
- **اقدام بعدی:** کامیت تغییرات به شاخه `main` با موافقت مهندس جان و همگام‌سازی ابری سند انتقال مگامن در گوگل درایو.

## ارسال به گیت‌هاب و تحویل قرارداد اقلام مرجوعی سفارش به Codex — 2026-11-28

- **ارسال تغییرات مأموریت فاز A2 به گیت‌هاب (`git push`):**
  - شاخه `pr-85-phase-a1` با کامیت `5d51c96` به مخزن گیت‌هاب (`origin/pr-85-phase-a1`) ارسال شد.
- **تحویل قرارداد فاکتور تعدیل‌شده (Adjusted Order Returned Items):**
  - فیلدهای `returnedAmount` و `returnedItems` به اسکیمای `Order` در `lib/api-spec/openapi.yaml` اضافه شد و کدجن Orval اجرا گردید.
  - اندپوینت‌های `GET /orders/:id` و `GET /orders` در `artifacts/api-server/src/routes/orders.ts` به حواله‌های مرجوعی متصل شدند.
  - سرور پیش‌نمایش پورت ۳۳۰۰ راه‌اندازی مجدد و پاسخ معتبر فیلدهای مرجوعی برای سفارش ۳ به صورت تجربی اثبات شد: `{ id: 3, total: 24, returnedAmount: 12, returnedItems: [{ qty: 1, price: 12, restock: true, productId: 1, productName: 'نستتت' }] }`.
  - تسک آماده‌سازی چاپ فاکتور تعدیل‌شده به Codex تحویل داده شد.

## تایید متقابل راند ۲ مناظره و ثبت اجماع نهایی فاز A2 و موج‌های توزیع مویرگی — 2026-11-28

- **اتمام رسمی راند دوم مناظره بین Antigravity و Codex مطابق استاندارد `HYDRA_MAX_DEBATE_ROUNDS = 2`:**
  - آزمون عملیاتی سرتاسری رابط کاربری توسط Codex بر روی سرور پیش‌نمایش (پورت ۳۳۰۰) و پایگاه داده پیش‌نمایش (پورت ۵۵۴۳۲) با موفقیت کامل اجرا شد:
    1. وصولی نقدی (۱۲ ریال) و چک (۲۵ ریال) با تایید اعتبارسنجی‌ها، ثبت و تسویه قطعی در دیتابیس (۳۷ ریال).
    2. نمایش زنده پورسانت پلکانی بر پایه ۳۷ ریال وصولی تسویه‌شده.
    3. تخصیص سفارش ۳ به راننده ۲، بارگیری ۳ کارتن، تحویل ۲ قلم و مرجوعی ۱ قلم با رد خطای مرجوعی مازاد (۴ قلم)، تسویه ۱۲ ریال مرجوعی و خروج از بارگیری فعال.
    4. دریافت خطای ۴۰۹ در تلاش برای تخصیص مجدد همان سفارش.
    5. تولید هشدار کمبود موجودی (`LOW_STOCK`) با کالای آزمایشی و فیلتر صحیح در رابط کاربری.
    6. تطبیق مستقیم پایگاه داده: سفارش ۳ مبلغ ۲۴ ریال، موجودی کالا ۹۲ عدد، مانده مشتری ۱۷۹ ریال، مرجوعی ۱۲ ریال.
  - اصلاح محافظه‌کارانه OrderDetail در رابط کاربری توسط Codex (غیرفعال‌سازی چاپ فاکتور در زمان تعدیل ناشی از مرجوعی و نمایش هشدار) مورد تایید کامل Antigravity قرار گرفت و وضعیت تسک‌های برد به `✅ APPROVED` ارتقا یافت.
  - نیازمندی ارائه جزئیات نوع‌دار اقلام مرجوعی در قرارداد جزئیات فاکتور در بک‌لاگ فنی ثبت شد.
- **شواهد جامع کیفیت و سلامت فنی مونو‌ریپو:**
  - فرانت‌اند: ۷۱ تست پاس‌شده در ۱۵ فایل کامپوننت و صفحات (`@workspace/nadraan`).
  - سرور: ۲۳۷ تست پاس‌شده در ۲۶ فایل (`@workspace/api-server`).
  - کتابخانه‌ها: ۳۵ تست پاس‌شده در ۴ فایل (`lib/*`).
  - تایپ‌چک: صفر خطا در کل ۸ پکیج مونو‌ریپو (`pnpm run typecheck`).
  - بیلد کامل پروژه: ۱۰۰٪ موفق و وریفای‌شده (`pnpm run build`).

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


این فایل حافظه کوتاه‌مدت و نقطه شروع مخزن است. هر انسان یا Agent باید پیش از بارگذاری اسناد عمیق‌تر، این فایل را بخواند. این فایل وضعیت اجرایی را نگه می‌دارد، نه صرفاً برنامه آینده را.

## Current State

- **Project:** Forooshyar Plus
- **Market Position:** Sales & Distribution Operating Platform with Field Operations and Automation
- **Internal Vision:** Domain-Driven Business Operating Platform
- **Architecture:** Modular Monolith با Bounded Contextهای روشن
- **Authoritative Stack:** React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, OpenAPI
- **Current Official Checkpoint:** **A1 — Operational Foundation (Approved & Frozen)**
- **Next Checkpoint:** **A2 — Sales & Field Core**
- **Current Workstream:** Phase A2.5 & Phase A3 Backend Complete + Audited (250/250 Green Tests); Frontend Wave 1/2 READY_FOR_REVIEW; financial runtime acceptance blocked
- **MVP Scope:** Frozen (Expanded via `ADR-012` for Capillary Distribution Wave 1 & 2)
- **MVP Backlog:** 14 Epic و 41 Feature متعهد (ADR-010) + Wave 1/2 Capillary Distribution (`ADR-012`)
- **Frozen v2.4 baseline:** 11 Epic و 32 Feature
- **Status:** PHASE A2.5/A3 BACKEND GREEN (API + DB + Codegen + Demo Mock Verified; UI READY_FOR_REVIEW; runtime financial verification pending)
- **A1 Acceptance Criteria:** `docs/01_PRD/A1-Acceptance-Criteria.md` (هر ۱۲ فیچر + Audit Enabler کامل، ۱۰۰٪ پاس و فریز شدند)

## Execution Rule

Checkpoint A1 is Frozen. Development for Phase A2 can proceed.

فقط **یک Workstream اجرایی** در هر لحظه فعال است. هر Agent قبل از شروع کار باید این فایل را بخواند و پس از پایان هر اقدام مهم، وضعیت، Evidence، Blocker و Next Action را در همین فایل و در صورت لزوم `PROJECT_STATUS.md` ثبت کند.

## Governance Gate — Platform / Module / Multi-tenancy

- **Platform boundary:** `Farakhorasan Platform`
- **Sales module:** `Forooshyar Plus`
- **Relationship:** `Farakhorasan Platform → Forooshyar Plus module`
- **Multi-tenancy:** اجباری به‌عنوان زیرساخت معماری؛ یک قابلیت اختیاری Post-MVP محسوب نمی‌شود.
- **بازاردان:** در وضعیت فعلی یک مفهوم/پوسته آینده پلتفرم است و **Feature اجرایی MVP نیست**.
- **بازارک:** نام سابق/منبع قابلیت‌های عملیات میدانی و اتوماسیون در فروشیار پلاس است، نه محصول مستقل.
- **Implementation gate:** شروع کدنویسی مربوط به multi-tenancy، platform shell، بازاردان یا هر تغییر architecture-impacting فقط پس از ADR پذیرفته‌شده + Scope Review + Acceptance Criteria مجاز است.
- این تغییرات در این PR فقط مستندسازی شده‌اند و **هیچ تغییر schema/API/UI/dependency/deployment** را مجاز نمی‌کنند.

## Completed / Frozen Phases

### Checkpoint 1.6 — MVP Delivery Ready
**Status: APPROVED & FROZEN**

- Business و Product Foundation
- Product Constitution و تصمیم‌های تجاری/معماری پذیرفته‌شده
- Domain، API، Database و UX baselines
- MVP 30-Day Scope
- Feature Admission Audit
- MVP Backlog و Cut Line
- Repository/Architecture baseline
- Modular Monolith package boundaries
- Authentication foundation
- Audit minimum
- API/Error conventions
- Structured logging و Request ID
- Health/Readiness endpoints
- Seed foundation
- CI definition
- Backup/Restore scripts
- Sprint 1 board / Feature IDs

### Sprint 0 — Target Environment Verification
**Status: APPROVED & FROZEN**

Artifacts موجود در Repository شامل Docker Compose، Dockerfileهای API/Web و اسکریپت‌های PowerShell مربوط به Initialize، Backup، Restore و Verify هستند. این وجود به‌تنهایی Evidence اجرای واقعی محسوب نمی‌شود.

## Sprint 0 Verification Evidence

**Status: ALL GATES PASS — verified on the target environment**

- **Environment:** Windows 10.0.26100 + Docker Desktop (Docker 29.8.0، Compose v5.5.1)، Node v24.12.0 روی Host و node 22.23.3 داخل container، pnpm 11.21.0
- **Date:** 2026-09-29
- **Sequence:** `Initialize-Farakhorasan.ps1` → `Backup-Database.ps1` → `Restore-Database.ps1` → `Verify-Sprint0.ps1`
- **Result:** هر ۸ گیت + `GATE-1.7-06.5` + `GATE-1.7-06.6` + `DB-CHECK` با PASS و خروج با کد 0

| Gate | Status | Evidence |
|---|---|---|
| GATE-1.7-01 Frontend production build | PASS | `pnpm --filter @workspace/nadraan run build` → build موفق و تولید `dist/public/assets/index-*.js` و `.css`؛ همان build داخل ایمیج `web` نیز اجرا شد |
| GATE-1.7-02 Docker Compose build/up | PASS | `docker compose build` → ایمیج‌های `forooshyar-api` و `forooshyar-web` ساخته شدند؛ `docker compose up` → `db` healthy، `api` healthy، `web` Up |
| GATE-1.7-03 Backend tests inside container | PASS با اخطار | اجرای واقعی stage `tester` با `DATABASE_URL` کانتینر → `Test Files 9 passed (9)`، `Tests 46 passed (46)`. ⚠️ این گیت در کانتینر **شکننده** است: در ۳ از ۱۰ اجرا یک تست به‌دلیل تایماوت hook شکست می‌خورد. جزئیات در بخش Current Gaps |
| GATE-1.7-04 Host Health/Readiness | PASS | `GET /api/healthz` → 200 و `GET /api/readyz` → 200 (شامل اتصال واقعی به PostgreSQL) |
| GATE-1.7-05 PostgreSQL backup | PASS | تولید artifact قابل شناسایی `backups/farakhorasan_20260929-*.dump` با `pg_dump -F c` |
| GATE-1.7-06 PostgreSQL restore | PASS | `DROP DATABASE` → `CREATE DATABASE` → `pg_restore` بدون خطا؛ جداول `users`، `customers`، `products`، `orders`، `refresh_tokens` و ستون `deleted_at` موجودند |
| GATE-1.7-07 Seed Admin login | PASS | `POST /api/dev/seed-admin` → 200/201 و `POST /api/auth/login` با Admin seed شده توکن معتبر برگرداند |
| GATE-1.7-08 Admin password rotation | PASS | تغییر رمز، ورود موفق با رمز جدید، و **رد شدن رمز قبلی با 401** |
| GATE-1.7-06.5 Drizzle schema sync | PASS | `pnpm --filter @workspace/db run push` بعد از restore → `No changes detected` |
| DB-CHECK soft-delete columns | PASS | `information_schema.columns` برای `users/customers/products/orders` ستون `deleted_at` را تأیید کرد |

### Residual limitations

- Backup/Restore روی دیتابیسی تقریباً خالی (schema-only، حجم dump حدود ۸۵۷ بایت) اجرا شد. صحت **Schema** تأیید شده است، اما صحت‌سنجی محتوا و حجم داده تجاری انجام نشده و باید پس از ورود دادهٔ واقعی تکرار شود.
- عبور گیت‌ها پیش از این ممکن نبود؛ در همین اجرا هفت نقص واقعی کشف و رفع شد. جزئیات در کامیت‌های `e49b70d`، `2b7073e`، `4850588`، `27e6576`، `7ee0fcd` و در `CHANGELOG.md`.
- **تصحیح علت crash:** توقف کانتینر API **فقط** از مسیر نادرست فایل worker در runner stage بود (`/app/dist` در برابر مسیر پخته‌شده `/app/artifacts/api-server/dist`). اعتبارسنجی `ERR_ERL_KEY_GEN_IPV6` در `express-rate-limit` فقط لاگ می‌شود و کشنده نبود؛ اصلاح `ipKeyGenerator` یک سخت‌سازی امنیتی مستقل (جلوگیری از دورزدن محدودیت ورود با IPv6) است، نه رفع crash.
- اسکریپت‌های Sprint 0 پیش از این اجرا نیز «توخالی» بودند: `GATE-1.7-03` فقط ایمیج می‌ساخت و تست‌ها را اجرا نمی‌کرد، و گیت رمز عبور با رمزی کار می‌کرد که خود اسکریپت محلی می‌ساخت، نه رمز واقعی container. هر دو اصلاح شده‌اند.

## Current Gaps / Blockers

### OPEN-1 — شکنندگی سوئیت API داخل کانتینر (GATE-1.7-03)

- **Status:** OPEN — پذیرفته‌شده و مستند، نه رفع‌شده
- **Symptom:** در محیط کانتینر، به‌طور متناوب یک تست با `Test timed out` یا `Hook timed out` شکست می‌خورد؛ هرگز خطای assertion نیست و تست شکست‌خورده در هر اجرا تغییر می‌کند.
- **Measured:** کانتینر ۳ شکست در ۱۰ اجرا (و ۱ در ۵، ۲ در ۵ در اندازه‌گیری‌های جداگانه)؛ هاست ۹ اجرای متوالی بدون هیچ شکست.
- **Scope:** فقط اجرای تست **داخل** کانتینر (گیت ۳ اسکریپت Sprint 0). هاست و CI از آن اثر نمی‌گیرند، چون CI تست‌ها را روی runner میزبان با سرویس PostgreSQL اجرا می‌کند، نه داخل ایمیج اپ.
- **Fixed along the way:** حذف `pool.end()` از `afterAll` دو فایل تست (pool مشترک module-level بود)، ایمن‌سازی مدیریت `process.env` در تست تازه، و بالا بردن سقف تایماوت از ۵s به ۱۵s برای سوئیت integration در کانتینر.
- **Ruled out:** موازی‌سازی فایل‌ها — با `--no-file-parallelism` هم ۲ از ۵ اجرا شکست خورد.
- **Unresolved:** علت قطعی مشخص نشده؛ آزمون بعدی، instrument کردن رویدادهای `pool` (connect/acquire/release) و نمونه‌برداری `pg_locks` / `pg_stat_activity` در لحظهٔ استال است.
- **Decision:** timebox شد و به‌عنوان نقص باز ثبت شد؛ A1 با گیت‌های هاست و CI جلو می‌رود.

## Known Repository / Documentation Inconsistencies

- برخی گزارش‌های قدیمی مانند `ISSUES_AND_IMPROVEMENTS.md` وضعیت Docker/Compose و اسکریپت‌های Sprint 0 را ناقص گزارش می‌کنند؛ وضعیت فعلی Repository وجود این artifacts را نشان می‌دهد. این گزارش‌ها باید هنگام استفاده به‌عنوان historical evidence در نظر گرفته شوند، نه Current State.
- در برخی اسناد قدیمی عبارت `Alembic: PASS` وجود دارد، در حالی که Stack رسمی و authoritative پروژه PostgreSQL + Drizzle ORM است. این عبارت نباید به‌عنوان Evidence فعلی Checkpoint 1.7 استفاده شود.
- وضعیت Soft Delete در Code/Schema تعریف شده است، اما اثبات وضعیت DB واقعی Target Environment بخشی از Verification محیط هدف است و نباید از روی Code به‌تنهایی فرض شود. (اکنون در `DB-CHECK` تأیید شده است.)
- بستهٔ `docs/00_Project/governance-v2.4/` یک snapshot تاریخی تاریخ‌دار (2026-08-04) است و هنوز «Checkpoint 1.6 / 1.7 CANDIDATE (BLOCKED)» را نشان می‌دهد. مرجع وضعیت فعلی فقط `PROJECT_STATE.md` است؛ این بسته نباید به‌عنوان وضعیت جاری خوانده شود.

## Execution Roadmap

```text
1.6 Frozen
  ↓
S0 — Target Environment Verification
  ↓
1.7 Freeze
  ↓
A1 — Operational Foundation
     AUTH-F01..F03 / SET-F01..F03 / PRD-F01..F03 / CUS-F01..F03
     معیار پذیرش: docs/01_PRD/A1-Acceptance-Criteria.md
  ↓
A2 — Sales & Field Core
     ORD-F01..F03 / TAR-F01..F02 / VIS-F01..F03
  ↓
A3 — Performance, Cash & Automation
     KPI-F01..F03 / COM-F01..F03 / COL-F01..F03 / ALT-F01..F03 / AUT-F01..F03
  ↓
A4 — Decision Layer
     DASH-F01..F03 / REP-F01..REP-F03
  ↓
A5 — Stabilization
  ↓
MVP Demo / Release
  ↓
Design Partner Pilot
```

## Phase Gates

| Phase | Gate | وضعیت فعلی | شرط عبور |
|---|---|---|---|
| 1.6 | MVP Delivery Ready | FROZEN | قبلاً تأیید شده |
| S0 | Target Environment Verification | FROZEN | هر ۸ Gate با Evidence |
| 1.7 | Engineering Foundation Ready | FROZEN | Gateهای S0 پاس شوند |
| A1 | Operational Foundation | FROZEN | 12 Feature + Audit Enabler (پاس کامل) |
| A2 | Sales & Field Core | READY | 8 Feature + Visit → Order E2E |
| A3 | Performance, Cash & Automation | NOT STARTED | 15 Feature + traceability |
| A4 | Decision Layer | NOT STARTED | Dashboard/Report operational |
| A5 | Stabilization | NOT STARTED | Critical/High صفر یا accepted |
| DP | Design Partner | NOT STARTED | MVP release + controlled pilot |

## Agent Execution Protocol

هر Agent باید:

1. `PROJECT_STATE.md` را بخواند.
2. `AGENTS.md` و اسناد حاکم را طبق ترتیب canonical بخواند.
3. فقط Task مربوط به Workstream فعال را اجرا کند.
4. قبل از تغییر کد، وضعیت Gate قبلی را بررسی کند.
5. هیچ Feature جدیدی را خارج از Cut Line شروع نکند.
6. پس از هر کار مهم، `PROJECT_STATE.md` و در صورت نیاز `PROJECT_STATUS.md` را به‌روزرسانی کند.
7. برای هر تغییر، این چهار مورد را ثبت کند: **What changed / Evidence / Remaining blockers / Next action**.
8. اگر چیزی اجرا نشده، آن را `PENDING` یا `UNVERIFIED` بنویسد، نه `PASS`.
9. اگر Blocker کشف شد، Forward Progress را متوقف و Blocker را ثبت کند.
10. تغییر معماری را بدون ADR انجام ندهد.
11. برای multi-tenancy، platform shell یا بازاردان، قبل از کدنویسی وجود ADR پذیرفته‌شده و Scope Review را بررسی کند.

## Agent Ownership

- **PM Agent:** Scope، milestone، prioritization، phase status
- **BA Agent:** Business rules، constraints، acceptance criteria
- **UX Agent:** User journeys، flows، usability
- **System Architect:** Boundaries، architecture، ADR consistency
- **Backend Agent:** API، domain logic، persistence
- **Frontend Agent:** UI، state، frontend integration
- **QA Agent:** Test strategy، regression، acceptance gates
- **DevOps Agent:** Docker، CI/CD، environment، backup/restore، observability
- **AI Architect Agent:** AI boundaries و governance؛ فقط در scope مصوب

## Mandatory Next Action

**فقط Target Environment Verification اجرا شود.** توسعه Sprint 1 تا Freeze شدن 1.7 متوقف است.

اجرای محیط هدف باید شامل این توالی باشد:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\Initialize-Farakhorasan.ps1
.\scripts\Backup-Database.ps1
$LatestBackup = Get-ChildItem .\backups\*.dump | Sort-Object LastWriteTime -Descending | Select-Object -First 1
.\scripts\Restore-Database.ps1 -BackupFile $LatestBackup.FullName
.\scripts\Verify-Sprint0.ps1
```

**توجه:** خروجی این Scriptها باید به‌صورت Evidence ثبت شود و صرفاً پیام موفقیت Script ملاک Pass نیست. مخصوصاً Login، Password Rotation و Restore باید با Assertion مستقل تأیید شوند.

## What Is Frozen

- Business و Product Foundation
- Product Constitution و تصمیم‌های تجاری/معماری پذیرفته‌شده
- Domain، API، Database و UX baselines
- MVP 30-Day Scope
- Feature Admission Audit
- MVP Backlog و Cut Line
- Checkpoint 1.6
- Checkpoint 1.7

## Explicitly Outside MVP

- Billing Engine و Automated Rating/Invoice/Reconciliation
- Message Broker و Transactional Outbox
- Partner Portal و Delegated Tenant Access UI
- Automated Partner Commission/Payout
- Marketplace
- Microservices decomposition
- Autonomous AI Agents
- بازاردان executable shell

## Architecture / Technical Context

Per ADR-0001, the implemented and authoritative repository stack is **React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, and OpenAPI**. No migration, merge, replacement, or stack substitution is approved at this time. Agents must treat the current repository implementation and current governance docs as authoritative. Any future stack change must go through a Decision Record and update all governance documents together.

## Agent Loading Strategy

1. `PROJECT_STATE.md`
2. `AGENTS.md`
3. `README.md`
4. `docs/00_Project/governance-v2.4/README.md`
5. `docs/00_Project/Roadmap.md`
6. `docs/README.md`

## Anti-Perfectionism Rule

- فقط یک Workstream اجرایی فعال باشد.
- Feature جدید پیش‌فرض Post-MVP است.
- Scope Review برای حذف و کوچک‌سازی است، نه افزودن.
- Design فقط برای Sprint جاری تولید می‌شود.
- پیشرفت با Working Software و Demo سنجیده می‌شود، نه تعداد سند.

## Operations Note

GitHub Actions PR validation (`.github/workflows/ai-pr-check.yml`) و baseline معماری (`ARCHITECTURE_GRAPH.md`) در Repository ثبت شده‌اند.

## Checkpoint 1.7 Status Update
What changed: Frontend Vite build zero-config fallback applied. Pino unhandled exception test logs filtered for <500 status codes. Checkpoint 1.7 has officially passed and frozen.
Evidence: Verified frontend production build successfully works headless without manual ENVs, typecheck passes across all workspaces.
Remaining blockers: None.
Next action: Proceed to Phase A1 Operational Foundation.

## Recent Actions
- Two defects found while reading the A1 codebase were closed: (a) `orders.code` still used the count-based generator that A1 had already replaced for products/customers, and `orders.code` had no uniqueness constraint — it now derives from the row id and is unique, with regression tests for reuse-after-hard-delete and DB-level uniqueness; (b) `GET /api/notifications` was reachable without a token (verified live: `200` anonymous vs `401` for `/products`), so both notification endpoints are now behind `requireAuth` and the stream no longer takes the token from the URL.
- Evidence: `pnpm run typecheck` PASS، `pnpm run build` PASS، API suite **63/63 در 12 فایل** روی هاست PASS، `db push` قید `orders_code_unique` را ساخت، و روی استک بازسازی‌شده: `login 200`، `GET /api/notifications` بدون توکن `401` و با توکن `200`، استریم با هدر فریم `__history__` فرستاد، سفارش نمونه `ORD-9192` (= 9000 + id) دریافت کرد (ردیف‌های آزمایشی پس از بررسی حذف شدند).
- Demo Mode implemented for GitHub Pages deployment using a frontend mock interceptor (VITE_DEMO_MODE=true) and namespaced local storage session keys.
- ADR-010 پذیرفته شد: قابلیت‌های بازارک در فروشیار پلاس ادغام شدند. Field Operations، Operational Alerts و Automation به Backlog فعال افزوده شدند؛ هیچ تغییر schema/API/UI/dependency/deployment در این اقدام انجام نشده است.
- ADR-011 پذیرفته شد: نام رسمی محصول به «فروشیار پلاس / Forooshyar Plus» تغییر یافت؛ نام‌های فنی و remote فعلی بدون تغییر باقی می‌مانند.
- **Phase A1 UI/UX Redesign & Operational Admin Center (Active Milestone)**:
  - بازطراحی رابط و تجربه کاربری در ۳ بریک‌پوینت (دسکتاپ، تبلت، موبایل) بر اساس ۵ استاندارد برتر پخش مویرگی FMCG.
  - پیاده‌سازی مرکز فرماندهی عملیات و پایپ‌لاین زنده ۴ مرحله‌ای توزیع در `dashboard.tsx`.
  - تبدیل صفحه تیم به پنل مدیریت جامع با ۳ بخش: مدیریت کاربران و نقش‌های سازمانی مویرگی، تنظیمات پیشوندها و قوانین سقف اعتبار (`/api/settings`)، و لاگ زنده رویدادهای امنیتی (`/api/audit-logs`).
  - رفع کامل نقص نمایش Base64 تصاویر کالا، رفع اختلال بازخوانی مشتری در دراپ‌داون سفارش با اصلاح کلید کش React Query، افزودن دکمه نمایش/پنهان‌سازی رمز و اعتبارسنجی فارسی فیلدها.
  - Evidence: `pnpm run typecheck` با کد 0 و بدون خطا، `pnpm run build` با کد 0، آزمون‌های API با نتیجه **۱۵۲ از ۱۵۲ پاس (۱۰۰٪)**، و استقرار موفق روی کانتینرهای Docker در حال اجرا (`forooshyar-web-1` روی پورت 80 و `forooshyar-api-1` روی پورت 3000).
- **RBAC & Organizational Hierarchy Restructuring (Active Milestone)**:
  - بازآرایی سلسله‌مراتب دسترسی و نقش‌های سازمانی بر پایه مدل مویرگی FMCG ایران با محوریت «مدیر عامل» در رأس ساختار (سطح ۱):
    ۱. مدیر عامل (CEO / بالاترین اختیار مدیریتی، مالی، تنظیمات و لاگ)
    ۲. مدیر فروش (نظارت کلان بر تیم فروش، سفارشات و مشتریان)
    ۳. سرپرست فروش (مدیریت نمایندگان و ویزیتورهای حوزه)
    ۴. حسابدار / مدیر مالی (تایید مالی فاکتورها و اعتبارسنجی)
    ۵. انباردار (مدیریت موجودی کالا و حواله خروج)
    ۶. ویزیتور / نماینده فروش (ثبت سفارش، ثبت مشتری و کاتالوگ)
    ۷. موزع / راننده (تحویل بار و توزیع میدانی)
  - اعمال گارد مسیرهای React (`App.tsx`) با هدایت خودکار بر اساس سطح دسترسی و پنهان‌سازی هوشمند منوهای سایدبار و نوبار موبایل.
  - پیاده‌سازی ماتریس تعاملی مجوزها و قوانین مدیریت سلسله‌مراتبی (امکان تخصیص و ویرایش فقط برای سطوح پایین‌تر از خود).
  - به‌روزرسانی کاربر مدیر پیش‌فرض به نقش «مدیر عامل» و هماهنگی کامل فرانت‌اند، بک‌اند و پایگاه داده.
- **TASK-003: Hydra Agent Communication Protocol (ACP) Contracts (Active Milestone)**:
  - پیاده‌سازی و استقرار قراردادهای تایپ‌اسکریپتی ۵ و اسکیماهای Zod برای پروتکل ارتباطی ایجنت‌های هیدرا در `@workspace/api-zod` (`lib/api-zod/src/hydra-acp.contract.ts`).
  - تضمین عدم وجود کست‌های `any`، تفکیک نقش‌های ایجنتیک (President, Strategist, Architect, Auditor, Operator, System).
  - تثبیت قانون سقف ۲ راند مناظره سنا (`HYDRA_MAX_DEBATE_ROUNDS = 2`) و ساختار رسیدهای اجرایی قطعی (`HydraExecutionReceipt`).
  - Evidence: اجرای ۱۳ آزمون واحد با Vitest با نتیجه **۱۳ از ۱۳ پاس (۱۰۰٪)** در ۱۹ میلی‌ثانیه، بیلد موفقیت‌آمیز Vite فرانت‌اند با کد 0، و ثبت مستندات رسمی تحویل در `HANDOVER.md`.
- **Phase A1 Operational Foundation Completion & Official Freeze (Approved & Frozen)**:
  - حل و اعتبارسنجی ۳ تصمیم باز (D1 تنظیمات پایه، D2 تغییر رمز عبور توسط خود کاربر، D3 ممیزی و Audit Enabler).
  - پیاده‌سازی و سخت‌سازی امنیتی روت `POST /api/auth/change-password` همراه با رد رمزهای تکراری، ابطال توکن‌های فعال، اعتبارسنجی فارسی، لاگ ممیزی و دیالوگ اختصاصی در `profile.tsx`.
  - اعتبارسنجی و پیوند داینامیک پیشوندهای کدگذاری محصول (`productCodePrefix`)، مشتری (`customerCodePrefix`) و سفارش (`orderCodePrefix`) از جدول `settingsTable` در تراکنش‌های دیتابیس.
  - به‌روزرسانی سند معیار پذیرش `docs/01_PRD/A1-Acceptance-Criteria.md` به وضعیت تایید و فریز کامل (۱۰۰٪ پاس).
  - Evidence: آزمون‌های تایپ‌چک سراسری با کد 0 و بدون خطا، ۱۱ تست احراز هویت پاس‌شده در `auth.test.ts`، ۵ تست تنظیمات پاس‌شده در `settings.test.ts`، ۳ تست ممیزی پاس‌شده در `audit.test.ts`، بیلد کامل فرانت‌اند در ۱۳.۸ ثانیه.
  - وضعیت خروج: گیت A1 با موفقیت عبور کرد و فریز شد؛ فاز بعدی A2 (Sales & Field Core) آماده استارت است.
- **Wave 1 (`Phase A2.5`) & Wave 2 (`Phase A3`) Backend + OpenAPI + Verification (Completed):**
  - پذیرش [`ADR-012`](docs/ADR/ADR-012.md) و اجرای کامل ارتقاهای پخش مویرگی در دیتابیس (`products`, `customers`, `users`, `orders`, `collectionsTable`, `deliveriesTable`)، قراردادهای `openapi.yaml` و بازتولید کلاینت با `orval` v5.
  - پیاده‌سازی روت‌ها و سرویس‌های `collections.ts` (نقد/کارت/چک صیادی + همگام‌سازی دفتر کل `syncCustomerBalance`)، `deliveries.ts` (حواله ناوگان + لیست بارگیری کارتن/عدد + مرجوعی جزئی اتمیک)، `commissions.ts` (پورسانت پلکانی روی وصولی تسویه‌شده)، `alerts.ts` (۴ هشدار زنده)، و سخت‌سازی کامل `orders.ts` (تخفیف، اشانتیون، بازگشت موجودی، چک برگشتی، تطبیق مشتری ویزیت)، `visits.ts` (ایزولاسیون ویرایش/خواندن و تراکنش واحد) و `customers.ts` (RBAC تغییر اعتبار و فیلتر منطقه).
  - Evidence: `pnpm run typecheck` با کد ۰، `pnpm run test:libs` (۳۵ تست در ۴ فایل)، `artifacts/api-server` (۱۸۰ تست در ۲۶ فایل با `--fileParallelism=false` روی Kiri)، و `artifacts/nadraan` (۳۵ تست در ۱۱ فایل) — مجموعاً **۲۵۰ تست سبز در ۴۱ فایل مونو‌ریپو**.
