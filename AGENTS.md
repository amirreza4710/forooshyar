# Agent Operating Guidelines & Verification Protocol

## 1. Microtask Verification & Self-Healing Protocol (MANDATORY)

Every code change must adhere to the deterministic quality gates enforced by GitHub Actions. Bypassing or attempting to alter the verification system is strictly prohibited.

### Execution Lifecycle:
1. **Branch & Implement:**
   - Create a feature branch (e.g., `feat/...` or `fix/...`).
   - Implement only the logic requested. Keep PR diffs minimal and focused.

2. **Wait for CI Deterministic Checks:**
   - After pushing the branch and opening a PR, wait for the verification pipeline to finish:
     ```bash
     gh pr checks
     ```

3. **Self-Healing on Failure (Max 3 Retry Rounds):**
   - If `Agent Microtask Verification Gate` fails, retrieve the machine-readable failure summary:
     ```bash
     python scripts/fetch_agent_feedback.py
     ```
   - Analyze the extracted `failed_tests` and `type_errors`.
   - Fix the implementation code.
   - Commit and push the fix back to the branch.

### Strict Invariants & Constraints:
- ❌ **NEVER edit or delete files in `tests/`:** Any failure must be resolved by fixing implementation logic, not modifying test expectations.
- ❌ **NEVER touch `.github/workflows/` or environment files (`.env*`):** Any modification to system-level files will immediately fail the blast radius gate.
- ❌ **NO Hallucinated Dependencies:** Only add packages to `requirements.txt` that exist and are verified on PyPI.
- ❌ **NO `[skip ci]` in commit messages:** Every commit must run through the automated audit.
## Jules Automated Task Intake

- هرگاه یک Issue با برچسب `jules-task` و `agent-escalation` ایجاد شد:
  1. اولویت نخست، بازخوانی خلاصه تریاژ و دسته خطای مشخص‌شده در متن Issue است.
  2. بدون نیاز به بازبینی تمام فایل‌های پروژه، صرفاً ماژول‌های مرتبط با آن دسته را بررسی و اصلاح کن.
  3. پول ریکوئست نهایی باید حاوی تگ `Closes #IssueNumber` باشد.
