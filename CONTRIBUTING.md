# Contributing

## Workflow
- Verify the previous step before starting the next step.
- Work in small, focused commits.
- Keep documentation and implementation changes separate when possible.
- Record significant architecture decisions in `docs/ADR/`.
- Update `PROJECT_STATE.md` when project status changes.

## Documentation Order
Core documents should be introduced in this order:
1. Business Constitution
2. Master Specification
3. Roadmap
4. Product Requirements Document
5. Rule Engine
6. Workflow Engine
7. Domain Model
8. KPI Framework


## Stage Gate Rule
Every sprint, checkpoint, or document handoff must follow this sequence:

1. Read `PROJECT_STATE.md` and identify the current step.
2. Check the previous step's expected output and acceptance criteria.
3. Confirm required files exist and contain no unresolved placeholders or conflicts.
4. Only then create or update the next document.
5. If the previous step is not complete, fix it first or record the blocker in `PROJECT_STATE.md`.
