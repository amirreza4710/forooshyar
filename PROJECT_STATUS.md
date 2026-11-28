# وضعیت پروژه — فروشیار پلاس

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


> این فایل Operational Status (وضعیت اجرایی) پروژه است. هر Agent باید قبل از شروع کار آن را بخواند و بعد از هر اقدام مهم، وضعیت خود را با **What changed / Evidence / Remaining blockers / Next action** به‌روزرسانی کند. اگر چیزی واقعاً اجرا نشده، مقدار آن `PENDING` یا `UNVERIFIED` است، نه `PASS`.

**آخرین آپدیت:** ۲۵ نوامبر ۲۰۲۶ — تکمیل کامل و تست‌شده بک‌اند و قراردادهای **موج ۱ (`Phase A2.5`)** و **موج ۲ (`Phase A3`)** پخش مویرگی (`collections`, `deliveries`, `commissions`, `alerts` + سخت‌سازی سفارش/انبار/ویزیت/دفترکل) با **۲۵۰ تست سبز در کل مونو‌ریپو** (`۱۸۰` api-server + `۳۵` nadraan + `۳۵` libs) و تحویل هوک‌های React Query v5 به Codex

---

## 1. خلاصه اجرایی

پروژه در وضعیت **Phase A2.5 & A3 Backend Complete & Verified (250/250 Green) / A2.5 & A3 UI READY_FOR_REVIEW — runtime financial acceptance pending** قرار دارد.

1. **موج اول — تکمیل عملیات پخش مویرگی (`Phase A2.5`):**
   - ارتقای اسکیمای دیتابیس و OpenAPI برای قیمت تمام‌شده (`costPrice`)، تعداد در کارتن (`unitsPerPack`)، حداقل موجودی (`minStock`)، منطقه جغرافیایی مشتری و ویزیتور (`zone`, `assignedZone`)، تخفیف، اشانتیون (`isBonus`) و روش پرداخت سفارش.
   - بازگشت اتمیک موجودی انبار هنگام لغو یا حذف سفارش (`adjustOrderStock` در `lib/inventory.ts`)، مسدودسازی مشتری دارای چک برگشتی، ایزولاسیون داده‌های ویزیتور (`orders` و `visits`)، محدودسازی تغییر سقف اعتبار/مانده بدهی به مدیران/مالی، تطبیق اجباری مشتری سفارش با ویزیت، و محاسبه سود ناخالص/کسری موجودی/چک برگشتی در داشبورد.

2. **موج دوم — چرخه مالی، توزیع ناوگان، پورسانت و هشدارهای هوشمند (`Phase A3`):**
   - ایجاد جداول و ماژول وصولی مطالبات و چک صیادی (`collectionsTable` با دفتر کل قطعی بدهی مشتری `syncCustomerBalance`)، ماژول توزیع ناوگان و لیست بارگیری کارتن‌محور با تسویه مرجوعی جزئی (`deliveriesTable`)، محاسبه پورسانت پلکانی بر پایه وصولی تسویه‌شده (`commissions.ts`)، و مرکز ۴گانه هشدارهای صبحگاهی مبتنی بر فکت دیتابیس (`alerts.ts`).
   - اصلاح تنظیم `orval.config.ts` (`query.version: 5`)، همگام‌سازی `demo-mock.ts` و پاس شدن کامل **۲۵۰ تست در ۴۱ فایل مونو‌ریپو** بدون خطا.

3. **زیرساخت تارگت‌ها و ویزیت‌های فاز A2 (`A2-TASK-01..07`):**
   - تایپ‌چک کامل ۳۵ تست رابط کاربری Codex در `artifacts/nadraan` + هوک‌های تایپ‌شده ویزیت‌ها و تارگت‌ها بر روی دیتابیس کانتینری Kiri تایید شدند.



---

## 2. آنچه اجرا/تکمیل شده است

### A0 — Engineering Foundation

| آیتم | وضعیت | توضیح |
|---|---|---|
| Repository / Branch / PR policy | DONE | Governance و AGENTS موجود |
| Modular Monolith boundaries | DONE | Package boundaries و Architecture Graph ثبت شده |
| PostgreSQL + Drizzle baseline | DONE | Stack authoritative |
| Authentication foundation | DONE | Foundation موجود |
| API/Error conventions | DONE | در baseline ثبت شده |
| Audit minimum | DONE | Foundation موجود |
| Structured logging / Request ID | DONE | Pino + request context |
| Health / Readiness | DONE | Endpointها موجود |
| Seed foundation | DONE | Seed artifact موجود |
| CI minimum | DONE | PR validation workflow موجود |
| Docker Compose | DONE | db/api/web تعریف شده |
| API Dockerfile | DONE | موجود |
| Web Dockerfile | DONE | موجود |
| Backup script | DONE | موجود |
| Restore script | DONE | موجود |
| Sprint 0 Verify script | DONE | موجود، ولی پوشش Gate کامل نیست |

### Checkpoint 1.6

**APPROVED & FROZEN**

MVP Scope، Cut Line، Domain/API/DB/UX baselines و 11 Epic / 32 Feature متعهد شده‌اند.

---

## 3. Gateهای باقی‌مانده برای Checkpoint 1.7

| ID | Gate | Status | Evidence مورد نیاز | Owner |
|---|---|---|---|---|
| GATE-1.7-01 | Frontend production build | PENDING | build موفق روی Target Environment | DevOps + Frontend |
| GATE-1.7-02 | Docker Compose build/up | PENDING | compose runtime واقعی | DevOps |
| GATE-1.7-03 | Backend tests inside container | PENDING | test output داخل container | QA + Backend + DevOps |
| GATE-1.7-04 | Host Health/Readiness | PENDING | curl/browser/PowerShell evidence از Host | DevOps + QA |
| GATE-1.7-05 | PostgreSQL backup | PENDING | backup artifact واقعی | DevOps |
| GATE-1.7-06 | PostgreSQL restore | PENDING | restore + integrity assertion | DevOps + QA |
| GATE-1.7-07 | Seed Admin login | PENDING | login واقعی موفق | Backend + QA |
| GATE-1.7-08 | Admin password rotation | PENDING | new password PASS / old password FAIL | Backend + QA |

**Gate Rule:** وجود Script یا کد، Evidence اجرای واقعی نیست.

---

## 4. مشکلات و تناقضات باقی‌مانده

### BLOCKER-01 — Target Environment هنوز Verify نشده

محیط هدف Windows + Docker Desktop باید واقعاً اجرا شود. این مهم‌ترین Blocker فعلی است.

### BLOCKER-02 — `Verify-Sprint0.ps1` پوشش کامل Gate را ندارد

Script فعلی Health/Readiness و Backend test را بررسی می‌کند، اما Login، Password Rotation و Backup/Restore را به‌صورت مستقل به‌عنوان Assertion کامل Verify نمی‌کند.

**تصمیم:** قبل از Freeze نهایی 1.7، Verification باید با Evidence مستقل تکمیل شود. اگر لازم شد Script اصلاح شود، فقط برای Gate Verification و بدون افزودن Feature محصولی.

### BLOCKER-03 — Soft-delete روی DB واقعی هنوز باید اثبات شود

Code/Schema شامل `deleted_at` است، اما وضعیت Target/Dev DB واقعی فقط با اتصال واقعی و query read-only قابل اثبات است.

### DOC-01 — برخی گزارش‌های تاریخی stale هستند

`ISSUES_AND_IMPROVEMENTS.md` بخش‌هایی دارد که Docker/Compose و Scriptهای Sprint 0 را missing گزارش می‌کند، در حالی که Repository فعلی آن‌ها را دارد. این سند باید به‌عنوان Historical Audit تفسیر شود، نه Current State.

### DOC-02 — عبارت تاریخی `Alembic: PASS`

Stack رسمی Drizzle است. عبارت Alembic در بعضی گزارش‌های قدیمی Evidence معتبر Checkpoint 1.7 محسوب نمی‌شود.

---

## 5. Roadmap اجرایی ۳۰ روزه

### Phase S0 — Target Environment Verification
**Frozen / Historical baseline**

هدف: تبدیل Foundation Release Candidate به Engineering Foundation Verified.

خروجی: ۸ Gate پاس + Evidence ثبت‌شده + Checkpoint 1.7 Frozen.

### Phase A1 — Operational Foundation | Days 4–10

- AUTH-F01..F03
- SET-F01..F03
- PRD-F01..F03
- CUS-F01..F03

Exit Gate: login، settings، product، customer و audit minimum به‌صورت عملیاتی.

### Phase A2 — Sales & Field Core | Days 11–18

- ORD-F01..F03
- TAR-F01..F02
- VIS-F01..F03

Exit Gate: Sales Rep Check-in → Customer → Order → Visit/Order Link → Target Achievement End-to-End.

### Phase A3 — Performance, Cash & Automation | Days 19–24

- KPI-F01..F03
- COM-F01..F03
- COL-F01..F03
- ALT-F01..ALT-F03
- AUT-F01..AUT-F03

Exit Gate: KPI/Commission traceable، Collections تا ثبت پرداخت، و Alert/Automation logged باشد.

### Phase A4 — Decision Layer | Days 25–27

- DASH-F01..F03
- REP-F01..F03

Exit Gate: Dashboard/Reports عملیاتی با RBAC.

### Phase A5 — Stabilization | Days 28–30

- Critical/High bug fixes
- Permission review
- Backup/Restore final verification
- Data integrity checks
- Mobile/Desktop smoke test
- Release notes
- Runbook
- Controlled demo

### Phase DP — Design Partner Pilot

بعد از MVP Release:

- یک سازمان
- حداکثر ۶ کاربر میدانی
- فرآیند راه‌اندازی
- مهاجرت داده اولیه
- آموزش
- Dashboard
- KPI قبل/بعد
- ROI measurement

هدف: اثبات Customer Value، نه صرفاً تحویل نرم‌افزار.

---

## 6. وضعیت فازها

| Phase | Status | Next Transition |
|---|---|---|
| 1.6 MVP Delivery Ready | FROZEN | — |
| S0 Target Verification | FROZEN | — |
| 1.7 Engineering Foundation Ready | FROZEN | — |
| A1 Operational Foundation | ACTIVE | تکمیل 12 Feature + Exit Gate |
| A2 Sales Core | NOT STARTED | بعد از A1 |
| A3 Performance & Cash | NOT STARTED | بعد از A2 |
| A4 Decision Layer | NOT STARTED | بعد از A3 |
| A5 Stabilization | NOT STARTED | بعد از A4 |
| Design Partner | NOT STARTED | بعد از MVP Release |

---

## 7. Agent Ownership و قرارداد وضعیت

| Agent | مالکیت اصلی | در S0 چه می‌کند؟ |
|---|---|---|
| PM | Scope / milestone / prioritization | Gate tracking و جلوگیری از scope creep |
| BA | Business rules / acceptance | تعریف assertionهای کسب‌وکاری لازم |
| UX | flows / usability | فعلاً فقط در صورت blocker |
| System Architect | architecture / ADR | جلوگیری از تغییر معماری بدون ADR |
| Backend | API / domain / persistence | رفع blockerهای Auth/DB در صورت اثبات نیاز |
| Frontend | UI / integration | production build و blockerهای build |
| QA | testing / acceptance | طراحی و اجرای acceptance evidence |
| DevOps | environment / Docker / backup | مالک اصلی S0 execution |
| AI Architect | AI governance | خارج از S0 مگر task مصوب |

### قرارداد اجباری هر Agent

پس از هر Task مهم، این چهار مورد را در `PROJECT_STATUS.md` ثبت کند:

```text
What changed:
Evidence:
Remaining blockers:
Next action:
```

اگر Task فقط بررسی بوده است، هیچ کدی به‌عنوان Completed اعلام نشود.
اگر تست اجرا نشده است، `UNVERIFIED` ثبت شود.
اگر محیط واقعی در دسترس نبوده است، `TARGET ENVIRONMENT NOT VERIFIED` ثبت شود.

---

## 8. قوانین پیشرفت

1. فقط یک Workstream فعال.
2. تا Freeze شدن 1.7 هیچ Feature محصولی شروع نمی‌شود.
3. Feature جدید پیش‌فرض `POST_MVP_CANDIDATE` است.
4. Scope Review فقط برای حذف/کوچک‌سازی.
5. هر تغییر معماری نیازمند ADR.
6. Working Software و Evidence بر تعداد سند مقدم است.
7. هیچ Agent مجاز نیست وضعیت را بدون Evidence از `PENDING/UNVERIFIED` به `PASS/DONE` تبدیل کند.
8. بعد از هر Merge مهم، Graph و وضعیت پروژه باید بازبینی شوند.

---

## 9. Next Action — تنها اقدام فعال

**A1 — Operational Foundation**

ترتیب پیشنهادی:

```text
1. Preflight Windows/Docker/Node/pnpm
2. Frontend production build
3. Docker Compose build
4. Docker Compose up
5. Backend tests inside container
6. Host Health + Readiness
7. PostgreSQL backup
8. PostgreSQL restore + integrity assertion
9. Seed Admin login
10. Admin password rotation
11. Soft-delete DB read-only verification
12. Evidence capture
13. Update PROJECT_STATE / PROJECT_STATUS
14. Freeze Checkpoint 1.7 only if all gates PASS
```

What changed: تکمیل و استقرار بک‌اند و قراردادهای OpenAPI/Zod/React-Query برای موج ۱ (`Phase A2.5`: قیمت تمام‌شده، کارتن، منطقه، تخفیف، اشانتیون، بازگشت خودکار موجودی در لغو/حذف سفارش، ایزولاسیون ویزیت/سفارش، گارد سقف اعتبار/چک برگشتی، سود ناخالص داشبورد) و موج ۲ (`Phase A3`: وصولی و چک صیادی، توزیع ناوگان و لیست بارگیری، پورسانت پلکانی روی وصولی تسویه‌شده و ۴ هشدار زنده) به همراه پذیرش `ADR-012` و ارتقای `demo-mock.ts`.

Evidence: تایپ‌چک کامل با ۰ خطا در هر ۸ پروژه (`pnpm run typecheck`)، ۱۴ تست سبز در `api-client-react`، ۲۱ تست سبز در `api-zod`، ۱۸۰ تست سبز در `api-server` (۲۶ فایل با `--fileParallelism=false` روی Kiri)، و ۳۵ تست سبز در `nadraan` (۱۱ فایل) — مجموعاً ۲۵۰ تست سبز در ۴۱ فایل.

Remaining blockers: در سمت بک‌اند بلاکری وجود ندارد؛ تنها ساخت و تکمیل صفحات جدید UI (`وصولی‌ها`, `توزیع و بارگیری`, `پورسانت`, `هشدارها` و فرم‌های تخفیف/اشانتیون/قیمت خرید) بر عهده VSCode Codex باقی مانده است.

Next action: اجرای پرامپت UI موج اول و دوم توسط Codex روی `artifacts/nadraan/**` و پس از آن پیاده‌سازی موتور اجرایی `TASK-004` (Hydra ACP Dispatcher).
