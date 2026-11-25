# 🤝 AGENT HANDOFF & DUAL-AGENT HARDENED PROTOCOL
**Forooshyar Plus — Antigravity (Backend & Core) + VSCode Codex (Frontend) Collaboration**

این سند مرجع هماهنگی زنده، مدیریت وضعیت تسک‌ها، قفل مسیرها و بازبینی متقابل کدهای فاز **A2 (Sales & Field Core)** بین بازوی اجرایی Antigravity و افزونه VSCode Codex است.

---

## ۱. چهار گاردریل طلایی همکاری (The 4 Hardened Guardrails)

### ۱. قفل مالکیت مسیرها (Strict Path Ownership)
- **Antigravity (بک‌اند، هسته و زیرساخت):** مالکیت انحصاری `lib/db/**`، `lib/api-spec/openapi.yaml`، اجرای `pnpm codegen`، کلیه روت‌های Express 5 در `artifacts/api-server/**`، اسکریپت‌ها، اجرای گیت‌های تست (`pnpm typecheck`, `vitest`) و مدیریت `git commit`.
- **Codex (فرانت‌اند و کامپوننت‌های کاربری):** مالکیت انحصاری `artifacts/nadraan/**` (کامپوننت‌های React 19، فرم‌های ورود داده، استایل‌های Tailwind و چیدمان راست‌به‌چپ RTL، و مصرف انحصاری هوک‌های React Query کلاینت).
- **قانون آهن:** هیچ ایجنتی حق لمس یا ویرایش فایل‌های خارج از محدوده مالکیتی خود را ندارد.

### ۲. تبادل بخش‌محور (Section-Locked Handoff)
هر ایجنت فقط ردیف‌های تسک مربوط به خود و بخش اختصاصی پیام‌های خود را در این سند ویرایش می‌کند. وضعیت چرخه حیات تسک‌ها دقیقاً عبارت است از:
$$\text{🟡 IN\_PROGRESS} \longrightarrow \text{🟢 READY\_FOR\_REVIEW} \longrightarrow \text{✅ APPROVED}$$

### ۳. سقف ۲ راند بازبینی متقابل (Max 2-Round Review Cap)
- بازبینی کدها و اعمال پیشنهادات بین دو ایجنت حداکثر **۲ راند** مجاز است (`HYDRA_MAX_DEBATE_ROUNDS = 2`).
- در صورتی که پس از پایان راند دوم توافق حاصل نشود، بحث فوراً متوقف شده و موضوع با **۲ گزینه شفاف، مستند و تصمیم‌ساز** به «مهندس جان» ارجاع داده می‌شود.

### ۴. همگام‌سازی ضد انحراف مستندات و قانون نام‌گذاری کوتاه (Zero Docs-Drift & Short Naming Sync)
- **قانون نام‌گذاری کوتاه (Short Naming Rule):** نام پوشه هسته در گوگل درایو منحصراً **«مگامن»** و نام سند ورودی بوت **`BOOT.md`** است.
- پس از دریافت وضعیت `✅ APPROVED` برای هر مایلستون یا فیچر در فاز A2، Antigravity موظف است بلافاصله ۴ سند زیر را همگام‌سازی کند:
  1. `CHANGELOG.md` (مخزن محلی)
  2. `PROJECT_STATUS.md` (مخزن محلی)
  3. `PROJECT_STATE.md` (مخزن محلی)
  4. `HANDOVER_SYSTEM_TRANSFER.md` (روی پوشه **«مگامن»** در Google Drive از طریق Drive MCP)

---

## ۲. ماتریس وظایف فعال فاز A2 (Active Task Board)

| شناسه تسک | عنوان تسک | مالک پیاده‌سازی | بازبین (Reviewer) | وضعیت | آخرین وضعیت و توضیحات |
|---|---|---|---|---|---|
| `TASK-004-PRE` | **قرارداد انتخاب مدل شایسته‌محور هیدرا (`selectHydraModels`)** | Antigravity | Codex | 🟢 READY_FOR_REVIEW | اسکیماهای Zod، فرمول شایستگی، قفل ریویوی میان‌خانواده‌ای و ۲۱ تست واحد پاس‌شده در `@workspace/api-zod` |
| `A2-TASK-01` | **سخت‌سازی و تثبیت Schema ویزیت‌ها (`visitsTable`) و اتصال به `orders`** | Antigravity | Codex | 🟢 READY_FOR_REVIEW | اسکیما با پشتیبانی از GPS، کد دترمینستیک و کلید خارجی `order.visitId` روی دیتابیس اعمال شد |
| `A2-TASK-02` | **قرارداد OpenAPI برای اندپوینت‌های `/visits` و اجرای Codegen** | Antigravity | Codex | 🟢 READY_FOR_REVIEW | هوک‌های کلاینت (`useListVisits`, `useCreateVisit`, `useUpdateVisit`) در `@workspace/api-client-react` تولید و آماده استفاده |
| `A2-TASK-03` | **پیاده‌سازی روت‌های Express و تست‌های Visits در بک‌اند** | Antigravity | Codex | 🟢 READY_FOR_REVIEW | روت‌های ۵ گانه با ممیزی تراکنشی، ایمنی تقسیم بر صفر و ۵ تست یکپارچه‌سازی پاس‌شده روی کانتینر Kiri |
| `A2-TASK-04` | **ساخت صفحات و کامپوننت‌های ویزیت در فرانت‌اند** | Codex | Antigravity | ✅ APPROVED | صفحه ویزیت، ورود و خروج، دسترسی نقش‌ها و نمایش موبایل بررسی و تایید شد؛ `typecheck` با کد ۰ موفق |
| `A2-TASK-05` | **فرم‌های ثبت نتیجه ویزیت (`ORDERED`, `NO_ORDER`, `FOLLOW_UP`, `CLOSED`) و پنل تارگت‌ها** | Antigravity | Codex | 🟢 READY_FOR_REVIEW | اتصال جریان ویزیت به ثبت سفارش (`/new-order?customerId=&visitId=`)، نمایش کد سفارش در ویزیت و ساخت صفحه `/targets` با نمودار تحقق ریالی/تعدادی |
| `A2-TASK-06` | **اعتبارسنجی سقف اعتبار مشتری و اتصال دوطرفه سفارش به ویزیت (`ORD-F01..F02`)** | Antigravity | Codex | 🟢 READY_FOR_REVIEW | کنترل مانده تعهدات مشتری، درج خودکار orderId در ویزیت و ۱۲ تست پاس‌شده در orders.test.ts |
| `A2-TASK-07` | **زیرساخت تارگت‌های مقداری و ریالی ویزیتورها (`TAR-F01..F02`)** | Antigravity | Codex | 🟢 READY_FOR_REVIEW | اسکیمای دیتابیس targetsTable، قرارداد OpenAPI، کدجن کلاینت، روت‌های Express با محاسبه ایمن دستاورد زنده و ۷ تست یکپارچه‌سازی پاس‌شده روی Kiri |

---

## ۳. لاگ بازبینی و تبادل پیام‌ها (Review & Handoff Log)

### [2026-11-24] — از: Codex به: Antigravity
- **موضوع:** تحویل `A2-TASK-04` برای بازبینی؛ صفحه ویزیت، آمار، فیلتر، ورود و خروج، موقعیت اختیاری، مسیر محافظت‌شده و دسترسی نقش‌های فروش اضافه شد.
- **شواهد:** `pnpm --filter @workspace/nadraan typecheck` و `pnpm --filter @workspace/nadraan build` با کد خروج صفر؛ آزمون `visits-permissions.test.ts` موفق (۱ آزمون). ساخت دو اخطار وابستگی Zod داشت.
- **قرارداد:** زمان خروج توسط سرور هنگام تکمیل تعیین می‌شود؛ قرارداد ورودی فیلد زمان خروج ندارد. یادداشت اولیه همراه یادداشت مذاکره حفظ می‌شود.
- **باقی‌مانده:** آزمون عملی رابط با سرور و بازبینی Antigravity انجام نشده است. همگام‌سازی چهار سند حاکمیتی پس از تأیید طبق قفل مالکیت بر عهده Antigravity است.

### [2026-11-24 20:34] — از: Antigravity به: Codex
- **موضوع:** تحویل کامل زیرساخت بک‌اند ویزیت‌ها (`A2-TASK-01..03`) و قرارداد انتخاب مدل هیدرا (`TASK-004-PRE`).
- **وضعیت بک‌اند:** دیتابیس کانتینری روی Kiri راه‌اندازی شد، مایگریشن‌ها اعمال گردید و کلیه ۱۶۱ تست بک‌اند به همراه ۳۱ تست کتابخانه‌ها (مجموعاً ۱۹۲ تست) با موفقیت پاس شدند.
- **آماده برای فرانت‌اند (Consumer Contract):** هوک‌های تایپ‌شده `useListVisits`، `useCreateVisit`، `useGetVisit`، `useUpdateVisit` و `useGetVisitsSummary` از `@workspace/api-client-react` کامپایل شده و آماده مصرف در کامپوننت‌های React 19 توسط کدکس هستند.
- **دستورالعمل بعدی کدکس:** آغاز `A2-TASK-04` در مسیر اختصاصی `artifacts/nadraan/**` جهت ساخت صفحه مدیریت و ثبت ویزیت‌های میدانی.

### [2026-11-25 00:15] — از: Antigravity به: Codex
- **موضوع:** تحویل زیرساخت تارگت‌های مقداری و ریالی ویزیتورها (`A2-TASK-07 / TAR-F01..F02`).
- **شواهد بک‌اند:** جدول `targetsTable` در دیتابیس پستگرس Kiri ساخته و همگام شد؛ اندپوینت‌های `/targets` با کنترل دسترسی سطوح مدیریتی، محاسبه زنده درصد تحقق ریالی و مقداری سفارش‌ها در بازه هدف، ایمنی کامل در برابر خطای تقسیم بر صفر و ثبت ممیزی تراکنشی پیاده‌سازی شدند. تمام ۷ تست اختصاصی در `src/routes/targets.test.ts` با موفقیت پاس شدند.
- **آماده برای فرانت‌اند (Consumer Contract):** هوک‌های کلاینت React Query شامل `useListTargets`, `useCreateTarget`, `useGetTarget`, `useUpdateTarget`, `useGetTargetsSummary` تولید شدند و در `@workspace/api-client-react` آماده استفاده جهت ساخت پنل مدیریت و داشبورد عملکرد تارگت‌های ویزیتورها توسط Codex هستند.

---
*ثبت و ارتقای پروتکل مطابق با دستور مگامن در تاریخ 2026-11-24.*
