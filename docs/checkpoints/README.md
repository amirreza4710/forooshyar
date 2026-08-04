# Checkpoints

Checkpoints are stage gates. They prevent the project from moving to the next step before the previous step is verified.

## Required Gate Sequence

1. Identify the current sprint and checkpoint from `PROJECT_STATE.md`.
2. Read the previous approved document or checkpoint.
3. Verify that required files exist and do not contain unresolved merge-conflict markers.
4. Verify that acceptance criteria are either complete or explicitly marked as open questions/blockers.
5. Update the next checkpoint only after the previous checkpoint is safe to depend on.

## Conflict Safety Rule

If a merge conflict was resolved in GitHub UI or by command line, the next agent must verify the affected files before continuing work. At minimum, run:

```bash
git status --short
git diff --check
rg -n "^(<<<<<<<|=======|>>>>>>>)" . --glob '!node_modules/**' --glob '!graphify-out/**'
```

## Current Checkpoint Map

| Checkpoint | Purpose | Required before moving on |
|---|---|---|
| 1.0 | Business Constitution baseline | Master Specification references the constitution |
| 1.1 | Master Specification baseline | Roadmap and PRD reference the master spec |
| 1.2 | PRD baseline | Rule Engine and Workflow Engine reference PRD scope |
| 1.3 | Domain and KPI baseline | UX and architecture work can rely on stable terms |
| 1.4 | Sprint 1 closeout | Sprint 2 can start safely |
