# CHANGE_CHECKLIST

این چک‌لیست باید قبل از ساخت PR و Merge اجرا و علامت‌گذاری شود.

## Pre-commit (local)
- [ ] Run `pnpm install` and ensure no postinstall failures.
- [ ] Run link-check locally (e.g., `npx markdown-link-check` روی docs/ و README.md).
- [ ] Regenerate graphify: `bash scripts/generate-graph.sh` بعد از پاک‌سازی کش طبق CLAUDE.md.
- [ ] Confirm `graphify-out/GRAPH_REPORT.md` updated and `graphify-out/graph.html` قابل باز شدن.
- [ ] Lint Markdown (remark) and fix warnings.

## Commit & Push (branch: chore/bazardan-documentation-canonicalization)
- [ ] Commit message follows convention: `docs: add <short>`
- [ ] Push to branch: chore/bazardan-documentation-canonicalization

## CI / PR Checks
- [ ] link-check job passes (no broken links)
- [ ] contract-tests (if any API/contract affected) pass
- [ ] smoke build passes (`pnpm run build` if needed)
- [ ] graph artifacts present in PR (GRAPH_REPORT.md, graph.html)
- [ ] PROJECT_STATUS.md updated if any state changes

## PR description template
Title: chore(docs): documentation canonicalization plan — conflict matrix + implementation plan
Body:
- Summary of changes
- Link to docs/CONFLICT-MATRIX.md
- Link to docs/IMPLEMENTATION_PLAN.md
- Checklist (this file)
- Requested reviewers: @amireza4710, @team-arch
- Notes: No code, DB, or dependency changes included in this PR

## Merge gates
- [ ] Approval from Product Manager and System Architect
- [ ] All CI checks green
- [ ] DB migration verification (if any) completed and recorded in PROJECT_STATUS.md

