# IMPLEMENTATION_PLAN

این سند Implementation Plan سطح بالا و فایل‌به‌فایل برای عملیات canonicalization مستندات است. همه تغییرات فقط در شاخه `chore/bazardan-documentation-canonicalization` انجام شده‌اند و هیچ تغییر در کد یا دیتابیس وارد نمی‌شود.

## هدف
تهیه یک Plan شفاف که برای هر فایل/مجموعه فایل موارد زیر را مشخص کند:
- چرا باید تغییر کند
- چه چیزی تغییر می‌کند
- چه چیزی نباید تغییر کند
- آیا Rename/حذف داریم؟
- اثرات بر referenceها و imports
- تست‌ها و verification مورد نیاز
- rollback plan
- مالک و estimated effort

---

## Summary of target files (initial)

- docs/00_Project/* (Governance updates)
- docs/02_Business/Business-Constitution-v1.0.md (canonicalization pending reconciliation)
- docs/ADR/* (add references to evidence where needed)
- docs/README.md (synchronize folder map)
- README.md (project-level summary updates)
- .agents/memory/MEMORY.md (fix broken links)
- graphify-out/GRAPH_REPORT.md (regenerated and committed)

> توجه: قبل از هر Rename یا تغییر نام فایل، باید یک Naming Drift Discovery انجام شود و تمام ارجاعات با graphify و link-check استخراج و بررسی شوند.

---

### Per-file plan (نمونه‌ها)

1) docs/02_Business/Business-Constitution-v1.0.md
- چرا: سند جدید است اما هنوز با PRD/Domain/Architecture همخوانی ندارد.
- چه تغییر: اضافه کردن بخش Mapping به PRD/Domain/Architecture و اضافه کردن status=Draft header (owner, date, reconciliation-needed)
- چه نباید تغییر کند: مفاد حقوقی/تجاری اصلی تا زمان تایید صاحبان
- Rename/Delete: خیر
- اثرات: نیاز به لینک صریح به PRD و ADRها؛ ممکن است نیاز به بروزرسانی ROADMAP در docs/00_Project
- تست/Verification: بررسی cross‑refs، owner confirmation, manual review
- rollback: revert commit (history preserved)
- مالک: Product Manager
- effort: 2–4 ساعت

2) docs/ADR/ (multiple)
- چرا: بعضی ADRها نیاز به لینک به شواهد دارند و ممکن است لازم باشد ADR-009 پس از Decision Extraction اضافه شود
- چه تغییر: افزودن بخش evidence (link to PR/meeting notes), owner and date
- چه نباید تغییر کند: تصمیم‌های ثبت‌شده سابق
- اثرات: بهبود traceability
- تست: link-check, review by Architect
- rollback: revert commit
- مالک: Architect
- effort: 1–2 ساعت per ADR

3) README.md (root)
- چرا: همگام‌سازی project state و roadmap پس از canonical decisions
- چه تغییر: اضافه کردن short note درباره Draft Business Constitution و لینک به docs/CONFLICT-MATRIX.md
- چه نباید تغییر کند: راهنمای اجرای محلی و دستورالعمل‌های پیکربندی
- تست: smoke build (pnpm run build) — فقط doc change اما sanity check
- rollback: revert commit
- مالک: Repo Owner / Product Manager
- effort: 0.5–1 ساعت

4) .agents/memory/MEMORY.md
- چرا: شامل لینک‌های شکسته است
- چه تغییر: اصلاح یا حذف لینک‌های شکسته و اشاره به CLAUDE.md location
- چه نباید تغییر کند: نکات فنی معتبر
- تست: link-check
- rollback: revert
- مالک: Repo Maintainer
- effort: 0.5–1 ساعت

5) graphify-out/GRAPH_REPORT.md
- چرا: نیاز به بازتولید برای استخراج Knowledge Diff و Naming Drift
- چه تغییر: regenerate report and commit only report/html
- چه نباید تغییر کند: cache files or internal .json files
- تست: open graph.html and verify hubs, run link-check
- rollback: revert
- مالک: Repo Maintainer
- effort: 1–2 ساعت

---

## Cross-file considerations
- All renames must be accompanied by a mapping table and automated link-fix script (or sed/ts-morph for code imports).
- API contract changes must have ADR + contract-tests + generated-client diffs reviewed.
- DB changes must be verified on dev with backup and smoke tests.

---

## Next actions to prepare PR
1. Run Naming Drift Discovery (graphify + link-check) and produce full list of affected files.
2. Update files as per per-file plan in the branch chore/bazardan-documentation-canonicalization.
3. Run cross-reference validation and contract tests.
4. Create PR with description linking to CONFLICT-MATRIX.md and IMPLEMENTATION_PLAN.md.
