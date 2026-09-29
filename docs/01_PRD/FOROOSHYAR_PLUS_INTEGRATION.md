# Forooshyar Plus — Canonical Capability Integration Scope

**Status:** Approved by ADR-010 and ADR-011
**Date:** 2026-09-29
**Source:** User-provided `BAZARAK_FOROOSHYAR_MERGED_SPEC.md` (v1.0, Draft / Engineering Baseline)

## Product boundary

Forooshyar Plus is a Sales & Distribution Operating Platform. Its existing Sales Core remains authoritative for identity, customers, products, pricing, orders, inventory, targets, KPI, commission, collections, reports, settings, audit, and logging.

The Bazarak capability baseline contributes Field Operations and Automation to the same product:

```text
Visit → Customer → Order → Inventory → Collection → KPI → Manager decision
```

PostgreSQL is the single source of truth. Automation consumes recorded business events; AI is decision support only and is deferred until operational data is reliable.

## MVP admission

The existing 32 features stay committed. The following nine features are added by ADR-010:

| Epic | Feature IDs | MVP outcome |
|---|---|---|
| Field operations | VIS-F01..F03 | Start/complete a customer visit, capture result, optionally associate an order, and show today’s visits. |
| Operational alerts | ALT-F01..F03 | Configurable inactivity, customer follow-up, and collection-due alerts. |
| Automation | AUT-F01..F03 | Logged daily summary, rep-inactivity, and collection-reminder workflows. |

The active MVP backlog therefore contains **14 epics and 41 features**.

## Rules

- Visit results: `ORDERED`, `NO_ORDER`, `FOLLOW_UP`, `CLOSED`.
- Visit capture includes sales rep, customer, timestamps, optional route/GPS, result, and optional order link.
- `conversionRate = orders / completedVisits`; zero completed visits produces no division error and is displayed as a defined empty/zero state.
- Alerts use configurable thresholds and are derived from recorded facts, not controller-local hard-coded state.
- Automation is logged and may notify; it cannot directly create orders, change inventory, finalize commission, or record payments.
- Retry/idempotency, daily route sequencing, notification adapters, and bots are pilot candidates. Intelligent route optimisation, AI prediction/upsell, marketplace, microservices, Kubernetes, vector databases, and autonomous agents are excluded.

## Delivery sequence and acceptance

1. **A1:** retain identity, settings, product, and customer foundations.
2. **A2:** deliver the first vertical slice: sales rep check-in → customer → order → persisted visit/order link.
3. **A3:** add traceable KPI/cash data, then alerts and logged workflows.
4. **A4:** expose executive and operational dashboard views from source-domain data.
5. **Pilot:** validate with real reps, orders, visits, and collection records before AI work.

Every slice is done only when type-safe, validated, tested, OpenAPI-aligned where applicable, auditable, and usable with error states.
