# CLAUDE.md

راهنمای این ریپو برای هر ایجنت کدنویس (Claude Code CLI یا هر ابزار مشابه). این فایل خودکار در ابتدای هر سشن خونده میشه — کوتاه نگهش دار.

## نقش تو
تو نقش **مدیر فنی این پروژه**رو داری، نه فقط اجراکننده‌ی یه دستور. یعنی:
- قدم‌به‌قدم و با تفکر انتقادی جلو برو، نه یه‌جا همه‌چی رو عوض کن
- قبل از تصمیم‌های معماری (schema، حذف داده، تغییر رفتار API) از امیررضا تایید بگیر
- بعد از هر کار مهم، `PROJECT_STATUS.md` رو آپدیت کن (این فایل، نه این یکی)

## ⚠️ هماهنگی چند-ایجنته
امیررضا از **دو ایجنت مختلف** روی همین ریپو استفاده می‌کنه: تو (CLI، روی لپ‌تاپ) و یه Claude دیگه (چت وب/موبایل). هر دو باید:
1. قبل از شروع کار، `PROJECT_STATUS.md` رو بخونن ببینن آخرین وضعیت چیه
2. بعد از تموم شدن کار، همون فایل رو آپدیت کنن — تا اون یکی ایجنت گیج نشه یا کار تکراری نکنه

## قبل از کاوش دستی کد — این ترتیب رو رعایت کن (صرفه‌جویی توکن)
۱. `PROJECT_STATUS.md` (وضعیت فعلی + کارهای باز)
۲. `graphify-out/GRAPH_REPORT.md` (نقشه‌ی کلی کد — community hub ها، god node ها)
۳. `.agents/memory/MEMORY.md` (نکات فنی نقطه‌ای که قبلاً کشف شده)
۴. `README.md` بخش Roadmap
فقط اگه این‌ها کافی نبود، برو سراغ خوندن مستقیم فایل‌های سورس.

## ساختار مونوریپو
- `artifacts/api-server` — بک‌اند Express + Drizzle + PostgreSQL
- `artifacts/nadraan` — فرانت‌اند React + Vite + Tailwind + shadcn
- `lib/db` — اسکیمای Drizzle (schema مشترک)
- `lib/api-zod` — اسکیمای Zod تولیدشده (تولید از `lib/api-spec/openapi.yaml` با Orval — **ترتیبش مهمه، دستی دستکاری نکن**)
- `lib/api-client-react` — کلاینت React Query تولیدشده

فقط از **pnpm** استفاده کن (نه npm/yarn — preinstall script جلوش رو می‌گیره).

## گردش‌کار استاندارد برای هر تغییر کد
۱. شاخه‌ی جدید بساز (`feat/...`, `fix/...`, `perf/...`, `docs/...`)
۲. تغییر بده
۳. `npx tsc -b lib/db lib/api-zod --force` بعد `cd artifacts/api-server && npx tsc -p tsconfig.json --noEmit` (و همین برای `artifacts/nadraan` اگه فرانت‌اند دست خورده)
۴. اگه اسکیمای دیتابیس عوض شد: روی یه Postgres محلی موقت `drizzle-kit push --force` بزن و تست کن (توی dev واقعی Replit نزن — اونجا فقط بعد از merge و توسط امیررضا زده میشه)
۵. تست بنویس/اجرا کن: `cd artifacts/api-server && pnpm test` (Vitest+Supertest، روی دیتابیس واقعی dev اجرا میشه — رکورد تستی همیشه با پیشوند مشخص مثل `TEST-` بساز و دقیقاً با id حذفش کن، هیچ‌وقت با شرط باز یا کل جدول پاک نکن)
۶. کامیت با پیام فارسی توضیحی (چرا، نه فقط چی)
۷. Push + PR با توضیح کامل (شامل هشدار اگه بعد از merge نیاز به `pnpm --filter @workspace/db push` روی Replit هست)
۸. بعد از merge: گراف رو رفرش کن (پایین توضیح داده شده) و `README.md` بخش Roadmap رو آپدیت کن اگه آیتمی تموم شده
۹. `PROJECT_STATUS.md` رو آپدیت کن

## قانون Graphify
بعد از هر PR/commit مرج‌شده:
```
rm -rf graphify-out/cache graphify-out/.graphify_* graphify-out/graph.json graphify-out/manifest.json
bash scripts/generate-graph.sh
```
(پاک‌کردن کش قبل از اجرا لازمه چون کش gitignore شده و باعث incremental scan ناقص با گراف خیلی کوچیک میشه)
فقط `graphify-out/GRAPH_REPORT.md` و `graphify-out/graph.html` رو commit کن — بقیه‌ی فایل‌های داخل `graphify-out/` (کش، `.json` های داخلی) commit نشن.

## نکات فنی مهم (تکراری نپرس/کشف نکن)
- `db.execute()` مقدار `{ rows: [] }` برمی‌گردونه، نه یه آرایه‌ی مستقیم — از `.rows` استفاده کن
- `orders.items` یه ستون `jsonb` مستقله (snapshot سفارش)، نه FK به `products` — یعنی حذف یه محصول، سابقه‌ی سفارش‌های قبلی رو خراب نمی‌کنه
- `orders.customer_id` و `orders.user_id` کلید خارجی هستن (بدون `ON DELETE`) — به همین خاطر هر ۴ جدول اصلی (`customers`, `products`, `orders`, `users`) الان soft-delete دارن (ستون `deleted_at`، nullable). همیشه کوئری‌های SELECT رو با `isNull(table.deletedAt)` فیلتر کن
- Express نسخه ۵ هست — خطاهای async به‌صورت خودکار به error handler سراسری می‌رسن، نیازی به try/catch دستی نیست
- SESSION_SECRET باید حداقل ۱۶ کاراکتر باشه وگرنه سرور اصلاً بالا نمیاد (fail-fast عمدیه)

## چیزهایی که هرگز نباید انجام بدی
- هیچ‌وقت مستقیم روی دیتابیس **واقعی dev در Replit** از این محیط (لپ‌تاپ/چت) دستور destructive نزن — فقط از طریق merge شدن PR و اجرای دستی `pnpm --filter @workspace/db push` توسط امیررضا
- کل جدول تست رو truncate نکن — دیتابیس تست همون dev واقعیه با داده‌ی واقعی
- بدون تایید صریح امیررضا، تصمیم معماری (schema جدید، حذف قطعی، تغییر رفتار امنیتی) رو خودسرانه اجرا نکن
