---
task_id: TASK-003-HYDRA-ACP-CONTRACT
repository: amirreza4710/forooshyar
base_commit: 72742b2e1abaa353f369da8fc9323bbf78bb2342
completed_by: Gemini (Spark Agent)
date: 2026-11-21
status: READY_FOR_LOCAL_VERIFICATION
---

# Handover — TASK-003-HYDRA-ACP-CONTRACT

## Summary
Defined strict TypeScript 5.x contracts, Zod validation schemas, and discriminated event interfaces for the **Hydra Agent Communication Protocol (ACP)** inside the canonical shared contracts package (`@workspace/api-zod` at `lib/api-zod/`), with zero `any` casts and strict enforcement of the **2-round ACP Senate debate cap** invariant (`HYDRA_MAX_DEBATE_ROUNDS = 2`).

## Strict Boundary Compliance
- Modified/created files strictly within `lib/api-zod/` plus this `HANDOVER.md`.
- Zero changes to API routes (`artifacts/api-server/`), database schemas/migrations (`lib/db/`), or frontend packages (`artifacts/nadraan/`).
- Prerequisite observation: the provided repository snapshot (`72742b2`) still contains `TASK-002-SECURITY-HARDENING` items (`sql.join` in `artifacts/api-server/src/routes/orders.ts` and `(req as any).id` in `artifacts/api-server/src/middleware/request-id.ts`), which were intentionally left untouched per task boundaries.

## Changed Files
- `lib/api-zod/src/hydra-acp.contract.ts` *(new)* — Protocol envelopes, Zod schemas, TypeScript interfaces, and discriminated union event definitions.
- `lib/api-zod/src/hydra-acp.contract.test.ts` *(new)* — Vitest unit tests covering envelope headers, multi-tenant validation, 2-round Senate debate cap, deterministic execution receipts, and protocol events.
- `lib/api-zod/src/index.ts` *(modified)* — Re-exports all symbols from `./hydra-acp.contract`.
- `lib/api-zod/package.json` *(modified)* — Adds `./hydra-acp` subpath export and `vitest` test scripts (`vitest: ^3.2.7`, already present in `pnpm-lock.yaml`).
- `HANDOVER.md` *(new)* — Records task completion, contract signatures, and verification steps.

## Contract Signatures (`@workspace/api-zod` / `@workspace/api-zod/hydra-acp`)
- **Constants:**
  - `HYDRA_ACP_PROTOCOL_VERSION = "1.0"`
  - `HYDRA_MAX_DEBATE_ROUNDS = 2`
- **Envelope & Header:**
  - `HydraActorRoleSchema` / `HydraActorRole`: `"PRESIDENT" | "STRATEGIST" | "ARCHITECT" | "AUDITOR" | "OPERATOR" | "SYSTEM"`
  - `HydraMessageHeaderSchema` / `HydraMessageHeader`: `{ messageId, correlationId, tenantId, actorId, role, timestamp, protocolVersion }`
  - `HydraMessage<TPayload = unknown>` & `createHydraMessageSchema<TPayloadSchema extends z.ZodType>(payloadSchema)`
- **Domain Payloads:**
  - `HydraIntentSchema` / `HydraIntent`: `{ intentId, action, domain, riskLevel, requiresHumanApproval, rationale, parameters }`
  - `HydraDebateRoundSchema` / `HydraDebateRound`: `{ intentId, roundNumber (int 1..2), topic, contributions, consensusReached, startedAt, concludedAt? }`
  - `HydraExecutionReceiptSchema` / `HydraExecutionReceipt`: `{ receiptId, correlationId, intentId, tenantId, outcome ("APPROVED" | "REJECTED" | "ESCALATED"), decidedBy, decidedByRole, roundsCompleted (int 0..2), evidence, reason?, recordedAt }`
  - `HydraEvidencePointerSchema` / `HydraEvidencePointer`: `{ evidenceId, kind, uri, summary, sha256? }`
- **Event Interfaces & Discriminated Union:**
  - `HydraIntentProposedEvent` (`HYDRA_INTENT_PROPOSED`)
  - `HydraDebateRoundCompletedEvent` (`HYDRA_DEBATE_ROUND_COMPLETED`)
  - `HydraExecutionDecidedEvent` (`HYDRA_EXECUTION_DECIDED`)
  - `HydraProtocolEventSchema` / `HydraProtocolEvent`

## Verification Status & Local Execution Commands
- **Static Audit (Verified in Sandbox):** Zero `any` occurrences in `lib/api-zod/src/hydra-acp.contract*.ts`; Zod v3.25 + v4 compatible APIs (`z.record(z.string(), z.unknown())`, `z.ZodType`, `z.number().int().min(1).max(2)`).
- **Build & Test Gate (Pending Local Run):** The uploaded repository archive did not include `node_modules` and the sandbox environment is offline. Run locally after applying the patch:

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm --filter @workspace/api-zod test
pnpm run build
```
