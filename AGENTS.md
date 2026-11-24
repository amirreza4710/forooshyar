# AGENTS.md — Forooshyar Plus / فروشیار پلاس
**Universal Agent Directives & Multi-Harness Collaboration Standard**

این دستورالعمل حاکمیتی برای همهٔ دستیارهای هوش مصنوعی و هارنس‌ها (Google Antigravity, OpenAI Codex, OpenCode, Claude Code, Cursor) در کل مخزن اعمال می‌شود.

---

## ۱. ارکان حاکمیتی مگامن (Megaman Core Invariants)

1. **خطاب الزامی (Mandatory Address):** همیشه و بدون استثنا، کاربر را منحصراً «مهندس جان» خطاب کنید.
2. **قانون دوزبانه‌سازی فنی (Bilingual Technical Rule):** بلافاصله پس از هر اصطلاح، مفهوم یا فناوری انگلیسی در مباحث فنی، استراتژیک یا محصولی، معادل فارسی یا توضیح کاربردی آن را داخل پرانتز درج کنید (English Term + Persian Explanation in Parentheses).
3. **تفکیک جزایر پروژه (Project Decoupling):** این مخزن (جزیره «فروشیار پلاس») یک سیستم خودمختار عملیات فروش و توزیع مویرگی است. هرگز هویت معمار کل را به یک محصول محدود نکنید.
4. **عدم انتظار کدنویسی دستی (Zero-Code / Vibe Coding & Multi-Agent Orchestration):** مهندس جان کدنویسی دستی انجام نمی‌دهد؛ تمامی دستورات، تغییرات و راه‌حل‌ها را کاملاً خودکار، ماژولار، تست‌شده و بدون نیاز به اصلاح دستی تحویل دهید.
5. **قانون نام‌گذاری کوتاه (Short Naming Rule):** نام پوشه هسته مرکزی در گوگل درایو منحصراً **«مگامن»** و نام سند ورودی بوت **`BOOT.md`** است.
6. **قانون منع انحراف مستندات (Zero Docs-Drift Rule):** هیچ تغییر فنی یا مایلستونی در فاز A2 کامل نیست مگر اینکه هم‌زمان ۴ سند (`CHANGELOG.md`، `PROJECT_STATUS.md`، `PROJECT_STATE.md` و نسخه `HANDOVER_SYSTEM_TRANSFER.md` در پوشه «مگامن» گوگل درایو) به‌روز شوند.
7. **سقف ۲ راند مناظره و ریویو (`HYDRA_MAX_DEBATE_ROUNDS = 2`):** در بازبینی متقابل بین ایجنت‌ها، ساب‌ایجنت‌ها و مدل‌ها، حداکثر ۲ راند مجاز است؛ در صورت عدم توافق در پایان راند دوم، توقف و گزارش با ۲ گزینه شفاف به مهندس جان.

---

## ۲. مرجع حقیقت و محدوده کار

- نام محصول **فروشیار پلاس / Forooshyar Plus** است. بازارک نام منبع قابلیت‌های Field Operations و Automation در این محصول است.
- مستندات `docs/` مرجع محصول، معماری و توسعه است.
- پیش از هر تغییر، به‌ترتیب بخوانید: `PROJECT_STATE.md`، این فایل، `docs/09_Development/AGENT_HANDOFF.md`، `README.md` و `docs/00_Project/Roadmap.md`.
- فاز فعال فعلی: **Phase A2 — Sales & Field Core** (شامل ۸ فیچر در ۳ اپیک: Visits, Orders, Targets).

---

## ۳. ساختار مونو‌ریپو و قفل مالکیت مسیرها (Strict Path Ownership)

| مسیر | مسئولیت و دامنه کار | مالک انحصاری (Author) | بازبین (Reviewer) |
|---|---|---|---|
| `lib/db/` | PostgreSQL/Drizzle schema و migrations | **Antigravity** | Codex |
| `lib/api-spec/openapi.yaml` | قرارداد canonical API | **Antigravity** | Codex |
| `lib/api-zod/`, `lib/api-client-react/` | Zod validators و React Query hooks (تولید با codegen) | **Antigravity** | Codex |
| `artifacts/api-server/` | Express 5 API، routeها، middleware و تست‌های Vitest | **Antigravity** | Codex |
| `artifacts/nadraan/` | React 19 + Vite frontend، صفحات، layout، کامپوننت‌ها و استایل RTL | **Codex** | Antigravity |
| `docs/` | مستندات canonical و ADRها | **Antigravity** | Codex |
| `scripts/` | seed، backup/restore و verification | **Antigravity** | — |

> [!CAUTION]
> هیچ ایجنتی حق ویرایش فایل‌های خارج از محدوده مالکیت خود را ندارد. هماهنگی صرفاً از طریق `docs/09_Development/AGENT_HANDOFF.md` انجام می‌شود.

---

## ۴. ابزارهای مجاز، ساخت و تست

- **فقط از `pnpm` استفاده کنید.** `npm`، `yarn` و lockfileهای آن‌ها اکیداً ممنوع هستند.
- کانتینرها و دیتابیس محلی روی **Kiri** (موتور کانتینر سبک Rust روی WSL2) اجرا می‌شوند.
- دستورات اصلی:
  ```bash
  pnpm install
  pnpm run typecheck
  pnpm run test:libs
  pnpm run build
  pnpm --filter @workspace/api-spec codegen
  ```

---

## ۵. گاردریل‌های هم‌افزایی دو ایجنت (Antigravity + VSCode Codex)

1. **Section-Locked Handoff:** هر ایجنت در `docs/09_Development/AGENT_HANDOFF.md` فقط در بخش و ستون اختصاصی خود وضعیت را ثبت می‌کند. وضعیت‌های مجاز:
   `🟡 IN_PROGRESS` ──→ `🟢 READY_FOR_REVIEW` ──→ `✅ APPROVED`
2. **Contract-First:** کدکس فقط و فقط از کلاینت تولیدشده React Query استفاده می‌کند و هرگز fetch دستی یا تایپ موازی نمی‌سازد.
3. **Commit & Push Guardrail:** دستورات `git commit`، `git push` و ساخت branch منحصراً با درخواست صریح مهندس جان و توسط بازوی اجرایی Antigravity انجام می‌شود.
