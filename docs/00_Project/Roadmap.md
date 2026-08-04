# Farakhorasan Product Roadmap

## Status

Draft. This roadmap becomes active only after Master Specification v2.0 passes Checkpoint 1.1 review.

## Roadmap Principles

- Prove measurable customer value before expanding plans or domains.
- Keep the 30-day pilot operationally narrow.
- Treat pricing as a hypothesis until paid-pilot evidence exists.
- Design future compatibility now; defer Billing, Partner Portal, and Microservices implementation.
- Require the Feature Admission Gate for product scope expansion.

## Phase 0 — Documentation and Decision Freeze

Exit criteria:

- Pricing Constitution changes reviewed
- ADR-006, ADR-007, and ADR-008 accepted
- Master Specification v2.0 approved
- PRD, Domain Model, Rule Engine, Workflow Engine, KPI Framework, and Permission Matrix owners identified
- MVP boundaries traceable from constitution to implementation plan

## Phase 1 — 30-Day Paid Design Partner Pilot

Commercial boundary:

- one organization
- up to six field users
- organizational, project-based pilot price
- manual invoice
- auditable usage export

Delivery outcomes:

- process baseline and target workflow
- initial data migration
- user training
- customer, product, visit, order, collection, KPI, and commission foundations required by the pilot
- before-and-after KPI evidence
- final ROI report

Exit criteria:

- at least one paid pilot completed
- baseline and outcome KPIs are comparable
- critical workflows meet agreed acceptance criteria
- support effort and variable service costs are measured
- renewal or expansion intent is recorded
- no unresolved critical data-integrity or access-control issue

## Phase 2 — Repeatability Validation

Target: three to five paid design partners.

Activities:

- validate willingness to pay
- measure onboarding effort and support load
- identify reusable versus custom requests
- validate Billable Seat activity rules
- validate Core Operations and Scale & Automation packaging
- measure Metered Service unit economics

Exit criteria:

- repeatable onboarding pattern
- reusable core workflow across customers
- target gross margin hypothesis supported by evidence
- custom development governed by the admission gate
- public packaging decision supported by data

## Phase 3 — Commercial Packaging

Candidate offers:

- Core Operations
- Scale & Automation
- contract-specific Enterprise

Deliverables:

- versioned PriceBook
- contract and discount versioning
- entitlement model
- Billable Seat rules
- Metered Service allowance and overage policy
- Monthly and Annual contract periods

Public pricing remains blocked until evidence supports it.

## Phase 4 — Billing Foundation

Triggered only by validated operational need.

Candidate scope:

- normalized billable event ingestion
- immutable usage ledger
- rating against versioned commercial data
- invoice draft
- reconciliation
- usage dispute evidence

Still requires separate implementation approval. Automated invoice issuance and Subscription Management are not implied by this phase.

## Phase 5 — Partner Enablement

Triggered by validated channel demand.

Candidate scope:

- partner agreements and capabilities
- customer attribution
- renewal and clawback rules
- delegated tenant administration
- payout ledger

Partner Portal and automated payouts require separate approval and security review.

## Deferred Until Triggered

- Microservices migration
- generalized Business Platform expansion
- marketplace
- four-plan public packaging
- automated partner payouts
- fully automated billing
