# Farakhorasan Master Specification v2.0

## 1. Document Control

| Field | Value |
|---|---|
| Product | Farakhorasan Sales OS / فروشیار |
| Version | 2.0 |
| Status | Draft for Sprint 1 review |
| Owner | Product Manager Agent |
| Business foundation | docs/02_Business/Business-Constitution-v1.0.md |
| Purpose | Single navigation, scope, and traceability hub |

## 2. Role of This Document

This Master Specification is the repository-wide navigation and traceability hub. It identifies canonical owners for decisions and prevents duplicate or conflicting specifications.

It is not a replacement for the Business Constitution, PRD, Domain Model, Architecture, ADRs, or implementation contracts. Detailed rules remain in their canonical documents.

## 3. Source-of-Truth Hierarchy

When documents disagree, use this order:

1. Business Constitution for business principles and commercial boundaries
2. Accepted ADRs for long-lived architecture and commercial structure decisions
3. Master Specification for scope, ownership, dependency, and traceability
4. Roadmap for sequencing and release gates
5. PRD for product requirements and acceptance criteria
6. Domain and Architecture documents for model and system structure
7. API, Database, Frontend, Backend, and Deployment documents for implementation contracts
8. Operations evidence for runtime validation

A lower layer cannot silently override a higher layer. Conflicts require an explicit change to the owning document and, when appropriate, an ADR.

## 4. Product Identity

### Internal vision

Domain-Driven Business Operating Platform.

### Current market position

Sales & Distribution Operating Platform.

The product must first prove the sales and distribution operating loop. The internal platform vision is not permission to expand the MVP into unrelated ERP, HR, finance, or generalized business-management domains.

## 5. Target Customer and Problem

The initial target is a distribution or field-sales organization that needs:

- controlled customer and product operations
- field visits and order capture
- collection visibility
- KPI and commission transparency
- reliable operational history
- measurable improvement over manual coordination

## 6. Product Operating Model

Material decisions flow through:

Business Constitution → Product Architecture → Implementation → Operations

Each layer must be traceable to the one above it.

## 7. Core Product Capability Map

| Capability | Current role | Canonical future owner |
|---|---|---|
| Identity and access | Core | PRD and Security Model |
| Customer operations | Core | PRD and Domain Model |
| Product operations | Core | PRD and Domain Model |
| Field visit workflow | Core | PRD and Workflow Engine |
| Order capture and status | Core | PRD, Domain Model, Rule Engine |
| Collection | Core identity | PRD and Domain Model |
| KPI framework | Core identity | KPI Framework |
| Commission | Core identity | Rule Engine |
| Rule and policy separation | Architecture principle | ADR-001, ADR-002, ADR-003 |
| AI assistance | Governed optional capability | AI Constitution and ADR-004 |
| Billing automation | Future module | ADR-006 and ADR-008 |
| Partner portal and payouts | Future module | ADR-007 |

## 8. Commercial Architecture

Farakhorasan uses a Hybrid SaaS Revenue Model consisting of:

- Base Organization Subscription
- Included Billable Seat Allowance
- Additional Seat Bundles
- Optional Product Add-ons
- Metered Services
- One-time Onboarding, Data Migration, and Approved Integrations
- Enterprise Support

Billable Seat is independent from RBAC and organizational Role. Billability is determined by auditable Business Activity rules.

AI, API, SMS, WhatsApp, calls, email, and other variable-cost services are Metered Services.

Current prices and discounts are hypotheses. No public four-plan price list is approved.

## 9. Initial Commercial Offer

The only approved pre-validation offer is the 30-Day Paid Design Partner Pilot:

- one organization
- up to six field users
- process setup
- initial data migration
- training
- dashboard
- before-and-after KPI measurement
- final ROI report

Pilot pricing is organizational and project-based.

After validation, intended packaging is:

| Package | Intended scope |
|---|---|
| Core Operations | CRM, visits, orders, collections, KPI, commission, foundational rules |
| Scale & Automation | advanced rules, approval, API, integration, automation, BI |
| Enterprise | contract-specific SLA, security, deployment, and services |

These packages remain hypotheses until pilot evidence supports them.

## 10. MVP Boundary

### In scope for the 30-day pilot

- reliable execution of the core sales and distribution loop
- tenant-scoped operational data
- controlled access
- customer, product, visit, order, collection, KPI, and commission foundations as required by the pilot
- onboarding, initial migration, training, and outcome measurement
- manual invoicing
- auditable usage export for Billable Seats and Metered Services used in the pilot

### Explicitly out of scope

- Billing Engine
- Subscription Management automation
- automated invoice issuance
- Message Broker introduced only for billing
- Partner Portal
- automated commission payout
- marketplace
- Microservices migration
- public four-plan pricing
- unrelated business domains

## 11. Product Admission Gate

A Product Capability requires all of:

1. Measured Customer Value
2. Reusability
3. Sustainable Unit Economics
4. Constitution Alignment

Security, backup, auditability, and observability may use the Architecture Enabler exception path with a documented risk, owner, budget, review date, and exit criterion.

## 12. AI Cost Gate

Each AI capability requires a Value Hypothesis, Unit Cost, Expected Usage, Target Gross Margin, Charging Strategy, Tenant Budget, Usage Cap, Fallback Strategy, and Kill Criteria.

## 13. Architecture Baseline

The current architectural direction is a Modular Monolith with clear Bounded Contexts.

Microservices are deferred until measured scale, independent ownership, regulatory isolation, or reliability requirements justify a separate ADR.

Future billing follows ADR-008 and uses normalized billable events, an immutable usage ledger, versioned rating inputs, reconciliation, and invoice issuance.

## 14. Reserved Future Concepts

The future Domain Model must reserve, without forcing MVP implementation:

- Organization
- Subscription
- Contract Version
- Plan
- PriceBook and Price Version
- Entitlement
- Seat Type
- Billable Seat
- Billable Activity Rule
- Metered Service
- Billable Event
- Usage Ledger Entry
- Partner
- Partner Capability
- Partner Agreement Version
- Customer Attribution
- Commission Rule
- Payout Ledger

Reserved concepts are specification commitments, not authorization to build their runtime modules in the MVP.

## 15. Canonical Document Register

| Concern | Canonical document | Status |
|---|---|---|
| Business principles | docs/02_Business/Business-Constitution-v1.0.md | Draft; pricing sections approved |
| Master scope and traceability | docs/00_Project/Master-Specification-v2.0.md | Draft for review |
| Delivery sequence | docs/00_Project/Roadmap.md | Draft; gated by Master Specification approval |
| Pricing architecture | docs/ADR/ADR-006.md | Accepted |
| Partner commercial model | docs/ADR/ADR-007.md | Accepted |
| Billing architecture | docs/ADR/ADR-008.md | Accepted |
| Product requirements | docs/01_PRD/ | Planned |
| Domain model | docs/03_Domain/ | Planned |
| System architecture | docs/04_Architecture/ | Planned |
| AI governance | docs/08_AI/ | Planned |
| Implementation contracts | docs/09_Development/ | Planned |

## 16. Change-Control Protocol

Every material change must:

1. Identify the canonical owning document.
2. Update that document first.
3. Create or update an ADR for long-lived architecture or commercial structure.
4. Update this document only when scope, dependency, status, or ownership changes.
5. Add a Change Log entry.
6. Update PROJECT_STATE.md when checkpoint or next work changes.
7. Preserve status precision: an Accepted ADR does not approve every document that references it.

## 17. Stage Gates

| Gate | Exit condition |
|---|---|
| 1.0 Business Constitution | Business foundation exists and unresolved questions are explicit |
| 1.1 Master Specification | Canonical hierarchy, scope, MVP boundary, and traceability are review-approved |
| 1.2 Roadmap and PRD | Requirements and release sequence reference the approved Master Specification |
| 1.3 Domain, rules, workflow, KPI | Shared terminology and acceptance criteria are consistent |
| 1.4 Sprint 1 closeout | Later UX and architecture work can rely on stable business documents |

## 18. Acceptance Criteria

- References Business Constitution v1.0.
- Identifies canonical ownership rather than duplicating detailed specifications.
- Includes the approved Pricing, Partner, and Billing decisions.
- Separates internal platform vision from current market positioning.
- Defines the 30-day MVP boundary and exclusions.
- Keeps Billing Engine and Partner Portal outside MVP.
- Defines change control and stage gates.
- Provides a canonical document register for agents and humans.
- Does not mark the overall Business Constitution as Accepted.
