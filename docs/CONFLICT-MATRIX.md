# CONFLICT-MATRIX

این ماتریس خروجی Action 1 (Audit) است — تضادها و وضعیت‌های دانش/تصمیم که باید قبل از هر Write حل شوند. این فایل صرفاً تحلیلی است و به‌منظور تصمیم‌سازی آماده شده است.

| موضوع | دسته (A/B/C/D) | وضعیت خلاصه | تصمیم / قاعده فعلی | مالک پیشنهادی | اولویت |
|---|---:|---|---|---|---:|
| Business Constitution | C (Unresolved) | سند Draft است؛ تطبیق با PRD/Domain/Architecture انجام نشده | نگهداری به‌صورت Draft؛ اجرای Reconciliation قبل از canonical | Product Manager + System Architect | P0 |
| Naming / Rename drift | B/C | لینک‌ها و نام‌ها احتمالاً ناهماهنگ‌اند | انجام Naming Drift Discovery با Graphify؛ سپس جدول Rename با اثرات و rollback. تا تصمیم تجاری نهایی، legacy branding فقط alias/historical reference است | Tech Lead / Repo Owner | P1 |
| ADR creation policy (ADR-009) | C | ADR جدید ممکن است قبل از استخراج تصمیم ثبت شود | ADRها پس از استخراج تصمیم و شواهد ثبت شوند؛ برای multi-tenancy، platform shell و بازاردان قبل از implementation، ADR پذیرفته‌شده الزامی است | Architect / Product | P0 |
| Farakhorasan Platform / Forooshyar Sales | C (Clarified) | مرز Platform و Sales module باید در همه اسناد یکسان باشد | `Farakhorasan Platform → Forooshyar Sales module`; MVP فعلی Scope فروشیار است، نه کل Platform | Product / Architecture | P0 |
| Multi-tenancy | A/C (Mandatory Architecture) | `organization_id` conceptually required اما implementation هنوز مجاز نشده | Multi-tenancy زیرساخت اجباری است؛ schema/API/access-control implementation فقط بعد از ADR + Scope Review | System Architect / Backend / DB Owner | P0 |
| بازاردان shell | C (Deferred) | مفهوم آینده پلتفرم است و Feature اجرایی MVP نیست | هیچ shell/UI/API/schema/dependency/deployment بدون ADR + Scope Review ساخته نشود | Product / Architecture | P0 |
| Implementation before governance | A (Risk) | Agentها ممکن است قبل از تصمیم رسمی وارد کدنویسی شوند | شروع کدنویسی برای architecture-impacting work فقط بعد از ADR Accepted + Scope Review + Acceptance Criteria | PM / System Architect | P0 |
| Branch Codex → main merge | A (Risk) | نباید بدون استخراج Diff Knowledge مرج شود | Diff extraction → Conflict matrix → Implementation Plan → Write branch → Validate → PR → Merge با تایید صریح | Repo Owner / Product Manager | P0 |
| Stack migration (FastAPI/Next vs existing) | C (Resolved) | پشته فعلی React+Vite + Express است؛ Candidate FastAPI/Next ثبت شده بود | حل شده توسط ADR-0001 (پشته فعلی Express مرجع است) | System Architect + Backend Lead | P0 |
| DB migration verification (PR #13) | C (Urgent) | اجرای pnpm --filter @workspace/db push روی dev تأیید نشده | فوری تأیید اجرا یا برنامه اجرای controlled migration با rollback | DB Owner / DevOps | P0 |
| Graphify / Knowledge artifacts | B | لینک‌های شکسته و artifacts ناقص | بازتولید graphify و تعمیر لینک‌ها؛ commit تنها گزارش‌ها | Repo Maintainer | P1 |
| Agent coordination (PROJECT_STATUS.md) | D (Consistent) | روند وجود دارد اما باید اجرا شود | هر ایجنت قبل/بعد از کار PROJECT_STATE.md را بخواند و بعد آپدیت کند | Repo Owner / Project Manager | P1 |
| Master Specification availability | B | Master Spec برنامه‌ریزی شده اما کامل نیست | تکمیل Master Spec قبل از canonicalization | Product Manager | P1 |
| API contract & generated clients | A | Orval/Zod pipeline حساس است | هر تغییر در API/clients نیاز به ADR و contract tests | Backend Lead + Frontend Lead | P0 |

---

## Governance Gate Summary

قبل از هر PR کدنویسی که به یکی از موارد زیر مربوط است:

- multi-tenancy
- platform shell
- بازاردان
- تغییر معماری یا مرزهای domain
- تغییر نام canonical در سطح محصول/پلتفرم

باید این توالی برقرار باشد:

```text
Decision extraction
      ↓
ADR Accepted
      ↓
Scope Review
      ↓
Acceptance Criteria + Architecture Impact
      ↓
Implementation PR
```

این PR فقط همین governance layer را تثبیت می‌کند و هیچ schema/API/UI/dependency/deployment را تغییر نمی‌دهد.

## عمومی

- canonical کردن قبل از reconciliation منجر به "نسخهٔ زیبا از تناقضات فعلی" می‌شود.
- Rename زودهنگام باعث شکست refها و imports خواهد شد.
- تغییر پشته بدون ADR و POC می‌تواند runtime breakage ایجاد کند.
- وجود یک تصمیم معماری به معنی مجوز اجرای فوری آن نیست؛ Scope Review نیز Gate مستقل است.

این فایل یک نقطه شروع برای Action 3 است — Implementation Plan فایل‌به‌فایل باید بر اساس این ماتریس و ADRهای پذیرفته‌شده تولید شود.
