# CONFLICT-MATRIX

این ماتریس خروجی Action 1 (Audit) است — تضادها و وضعیت‌های دانش/تصمیم که باید قبل از هر Write حل شوند. این فایل صرفاً تحلیلی است و به‌منظور تصمیم‌سازی آماده شده است.

| موضوع | دسته (A/B/C/D) | وضعیت خلاصه | تصمیم پیشنهادی | مالک پیشنهادی | اولویت |
|---|---:|---|---|---|---:|
| Business Constitution | C (Unresolved) | سند Draft است؛ تطبیق با PRD/Domain/Architecture انجام نشده | نگهداری به‌صورت Draft؛ اجرای Reconciliation قبل از canonical | Product Manager + System Architect | P0 |
| Naming / Rename drift | B/C | لینک‌ها و نام‌ها احتمالاً ناهماهنگ‌اند | انجام Naming Drift Discovery با Graphify؛ سپس جدول Rename با اثرات و rollback | Tech Lead / Repo Owner | P1 |
| ADR creation policy (ADR-009) | C | ADR جدید ممکن است قبل از استخراج تصمیم ثبت شود | ADRها فقط پس از استخراج تصمیم و شواهد ثبت شوند | Architect / Product | P1 |
| Branch Codex → main merge | A (Risk) | نباید بدون استخراج Diff Knowledge مرج شود | Diff extraction → Conflict matrix → Implementation Plan → Write branch → Validate → PR → Merge با تایید صریح | Repo Owner / Product Manager | P0 |
| Stack migration (FastAPI/Next vs existing) | A (Contradiction) | پشته فعلی React+Vite + Express است؛ Candidate FastAPI/Next ثبت شده | ممنوعیت جایگزینی بدون ADR و POC؛ Impact assessment لازم | System Architect + Backend Lead | P0 |
| DB migration verification (PR #13) | C (Urgent) | اجرای pnpm --filter @workspace/db push روی dev تأیید نشده | فوری تأیید اجرا یا برنامه اجرای controlled migration با rollback | DB Owner / DevOps | P0 |
| Graphify / Knowledge artifacts | B | لینک‌های شکسته و artifacts ناقص | بازتولید graphify و تعمیر لینک‌ها؛ commit تنها گزارش‌ها | Repo Maintainer | P1 |
| Agent coordination (PROJECT_STATUS.md) | D (Consistent) | روند وجود دارد اما باید اجرا شود | هر ایجنت قبل/بعد از کار PROJECT_STATUS.md را بخواند و بعد آپدیت کند | Repo Owner / Project Manager | P1 |
| Master Specification availability | B | Master Spec برنامه‌ریزی شده اما کامل نیست | تکمیل Master Spec قبل از canonicalization | Product Manager | P1 |
| API contract & generated clients | A | Orval/Zod pipeline حساس است | هر تغییر در API/clients نیاز به ADR و contract tests | Backend Lead + Frontend Lead | P0 |

---

ریسک‌های عمومی:
- canonical کردن قبل از reconciliation منجر به "نسخهٔ زیبا از تناقضات فعلی" می‌شود.
- Rename زودهنگام باعث شکست ریفرنس‌ها و imports خواهد شد.
- تغییر پشته بدون ADR و POC می‌تواند runtime breakage ایجاد کند.

این فایل یک نقطه شروع برای Action 3 است — Implementation Plan فایل‌به‌فایل باید بر اساس این ماتریس تولید شود.
