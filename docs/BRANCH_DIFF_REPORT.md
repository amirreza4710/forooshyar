# BRANCH_DIFF_REPORT

این گزارش جایگزین استخراج Diff Knowledge است. در این نسخه اولیه، فقط الگوی اجرای diff extraction و نکات اهمیت آمده است. لطفاً قبل از merge این گزارش را با خروجی واقعی `git diff` یا ابزار مشابه پر کن.

## How to extract Branch Diff Knowledge

1. Locally:
```bash
# fetch latest
git fetch origin main
# checkout the branch
git checkout chore/bazardan-documentation-canonicalization
# produce file list changed vs main
git diff --name-status origin/main...HEAD > branch-diff.txt
# optional: produce full patch
git diff origin/main...HEAD > branch-patch.diff
```
2. Use `graphify` on modified files to see cross‑refs.
3. Produce a table: File | Change Type | Affects (docs/code/imports) | Risk | Suggested mitigation

## Placeholder: branch-diff.txt

(گزارش واقعی در این فایل قرار خواهد گرفت پس از اجرای دستورهای بالا و آپلود نتیحه)
