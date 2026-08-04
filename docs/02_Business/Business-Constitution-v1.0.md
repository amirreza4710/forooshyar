# Business Constitution v1.0

## 1. Document Control

| Field | Value |
|---|---|
| Product | Farakhorasan Sales OS / فروشیار |
| Domain | Field sales, order capture, customer/product operations, distribution management |
| Version | 1.0 |
| Status | Draft for Sprint 1 review |
| Primary owner | Business Analyst Agent |
| Supporting owners | Product Manager Agent, System Architect Agent, QA Agent |
| Source baseline | Repository README, PROJECT_STATUS, PROJECT_STATE, existing API/domain code, and documented sprint plan |

## 2. Purpose

This constitution defines the business operating principles that all future product, UX, architecture, AI, and development documents must respect.

It is intentionally written before the Master Specification and PRD so later documents can reference stable business decisions instead of rediscovering scope from implementation details.

## 3. Product Identity

Farakhorasan Sales OS is a documentation-first sales and distribution operating system for managing:

- Field sales representatives / ویزیتورها
- Customers such as stores, supermarkets, and distribution accounts
- Products and inventory-sensitive order capture
- Sales orders and order status tracking
- Management dashboards for sales, customers, products, users, and operational health

The current codebase already implements the practical foundation of this operating model under the فروشیار / نادران‌گستر application identity. Future documents should treat this constitution as the stable business layer while implementation names can be normalized through later product and branding decisions.

## 4. Business Mission

The system must help the sales organization reduce manual coordination, prevent order and inventory mistakes, and give managers a reliable view of daily sales operations.

The mission is not only to register orders. The mission is to create a controlled sales workflow where every customer, product, order, user action, and business rule can be traced, reviewed, and improved.

## 5. Business Principles

### 5.1 Documentation is the source of truth

Business rules, workflows, policies, and acceptance criteria must be documented under `docs/` before they become hard-coded behavior.

### 5.2 Small, reversible change

Each important business change must be introduced through a focused commit or PR. Large batches of unrelated documents or implementation changes should be avoided.

### 5.3 Human accountability

AI can suggest, summarize, classify, or assist, but it must not become the final decision-maker for business-critical actions.

### 5.4 Rule transparency

Rules that affect orders, commissions, permissions, pricing, availability, or workflow state should be visible, auditable, and versionable.

### 5.5 Operational continuity

The system must protect historical business records. Deleting or changing customers, products, orders, or users must not break previous sales history.

### 5.6 Contract-first integration

API behavior should be defined through the API contract before clients and server implementations diverge.

## 6. Business Scope

### 6.1 In scope for the Sales OS

- User authentication and role-based access
- Sales representative operations
- Customer management
- Product management
- Order creation and order status tracking
- Dashboard KPIs and sales summaries
- Inventory-aware order validation
- Soft-delete or equivalent history-preserving lifecycle management
- Documentation-driven rule and workflow evolution
- ADR-backed architecture decisions

### 6.2 Out of scope until explicitly approved

- Direct destructive operations on production or real development data
- AI-autonomous approval of critical business actions
- Unreviewed schema changes
- Untracked pricing, commission, or policy changes
- Unversioned business rules embedded only in source code
- Large unrelated implementation rewrites during documentation sprints

## 7. Stakeholders and Operating Roles

| Role | Business responsibility | System expectation |
|---|---|---|
| Sales Representative / نماینده فروش | Register customer visits and sales orders | Fast mobile-first order entry and access to assigned sales data |
| Sales Manager / مدیر فروش | Monitor sales activity, users, orders, and operational KPIs | Dashboard visibility, user control, and order review capability |
| Supervisor / سرپرست | Govern team behavior and sensitive operations | Elevated access to administrative actions |
| Business Owner | Approve business rules, policies, and roadmap priorities | Clear documentation and reversible change history |
| Operations / Distribution | Ensure orders can be fulfilled correctly | Reliable product, customer, and order data |
| QA / Auditor | Verify business-critical behavior | Traceability from requirement to implementation and test evidence |

## 8. Core Business Objects

| Object | Meaning | Business notes |
|---|---|---|
| User | A person who can access the system | Role determines permissions and operational responsibility |
| Customer | A store, buyer, or account receiving sales service | Customer history must remain available even after deactivation |
| Product | A sellable item managed by the business | Product availability affects order acceptance |
| Order | A sales transaction registered by a user for a customer | Order items should preserve historical snapshots |
| Order Item | Product snapshot and quantity inside an order | Must not become invalid if product details later change |
| Dashboard KPI | A summarized business measurement | Must be derived from reliable operational records |
| Rule | A documented business condition or calculation | Should be externalized from implementation where practical |
| Policy | A governance or permission constraint | Should remain independent from business calculation rules |

## 9. Role and Permission Constitution

### 9.1 Baseline roles

The current business model recognizes at least these roles:

- `نماینده فروش`
- `مدیر فروش / نماینده`
- `سرپرست`

### 9.2 Permission principles

- Administrative user operations must be limited to elevated roles.
- Sales representatives should only receive access required for daily sales tasks.
- Permission changes are business decisions and must be documented before implementation.
- Policies must be separated from business rules so authorization does not become mixed with sales calculations.

## 10. Order Constitution

### 10.1 Order creation

An order is valid only when:

- The user is authenticated.
- The customer exists and is active.
- The selected products exist and are active.
- Requested quantities pass inventory and business validation.
- The order can be recorded without corrupting stock or historical records.

### 10.2 Order history

Order history is a business asset. It must remain understandable even when related customers, products, or users are later deactivated.

### 10.3 Order status

Order status must be controlled through a closed vocabulary. Free-form status values should not be accepted for business-critical workflows.

## 11. Product and Inventory Constitution

- Product records must support reliable sales and order entry.
- Product deletion must not destroy old order history.
- Inventory-sensitive operations must avoid overselling where inventory is authoritative.
- Stock changes caused by order creation must be transactional where the implementation supports it.
- Future inventory rules must be documented in the Rule Engine document before implementation.

## 12. Customer Constitution

- Customers are core commercial records.
- Customer information should be managed carefully because orders depend on it.
- Customer deactivation is preferred over destructive deletion when historical orders exist.
- Customer search, listing, and order creation flows must avoid showing deactivated records as active choices.

## 13. KPI Constitution

The first KPI framework must prioritize operational truth over vanity metrics.

Initial KPI categories:

- Total sales
- Order count
- Customer count
- Product count
- Recent sales trend
- Sales by representative
- Order status distribution
- Inventory risk signals

All KPI definitions must later specify:

- Formula
- Data source
- Refresh behavior
- Filter behavior
- Role visibility
- Known exclusions

## 14. Rule Engine Constitution

The Rule Engine exists to make changing business rules auditable and safer than editing scattered implementation logic.

Rules expected to move into the Rule Engine over time:

- Order acceptance conditions
- Inventory validation
- Commission calculations
- Campaign-specific sales rules
- Product/customer eligibility rules
- KPI thresholds and alert conditions

This constitution aligns with ADR-001 and ADR-003.

## 15. Policy Engine Constitution

Policies define what actors are allowed to do. Rules define how business logic is evaluated.

The two must remain separate so permission decisions are not hidden inside calculation logic. This constitution aligns with ADR-002.

## 16. AI Constitution

AI may assist with:

- Drafting documents
- Summarizing project state
- Suggesting next steps
- Reviewing consistency
- Generating prompts and checklists
- Highlighting risks and missing decisions

AI must not independently:

- Approve business-critical actions
- Change pricing, commission, or policy behavior without review
- Execute destructive data operations
- Override deterministic validation
- Become the sole source of truth

This constitution aligns with ADR-004.

## 17. Data Integrity Constitution

- Business data must remain traceable.
- Historical orders must not break when related records change.
- Soft-delete or equivalent lifecycle controls are preferred for core records.
- Schema changes that affect real data require explicit review and migration planning.
- Tests must avoid destructive cleanup patterns against shared development data.

## 18. Documentation Dependency Order

All future Sprint 1 core documents depend on this constitution.

Required next documents:

1. Master Specification v2.0
2. Roadmap
3. PRD
4. Rule Engine
5. Workflow Engine
6. Domain Model
7. KPI Framework

## 19. Open Questions

- Should the final public product identity be `Farakhorasan Sales OS`, `فروشیار`, or another approved brand name?
- Should the repository license remain MIT or should the private business deployment use a proprietary license notice?
- Which exact roles beyond `نماینده فروش`, `مدیر فروش / نماینده`, and `سرپرست` are required for the factory/distribution environment?
- Which order statuses are final for the first PRD version?
- Which inventory source is authoritative when stock data conflicts with sales entry?

## 20. Acceptance Criteria for This Constitution

- The document is committed under `docs/02_Business/`.
- Future Master Specification and PRD documents can reference this document as the business foundation.
- Any conflicting future business decision must update this document or record an ADR.
- `PROJECT_STATE.md` is updated to point to the next Sprint 1 document.


## 21. Product and Commercial Positioning

The internal product vision is a Domain-Driven Business Operating Platform.

The current external market position is narrower and testable: a Sales & Distribution Operating Platform. The broader platform vision must not expand the MVP into unrelated business domains before the sales and distribution operating loop has demonstrated measurable customer value.

The implementation baseline remains a Modular Monolith with explicit Bounded Contexts. Microservices require a future ADR supported by measured scale, ownership, or reliability needs.

## 22. Operating Model Layers

Every material change must flow through four layers:

1. Business Constitution
2. Product Architecture
3. Implementation
4. Operations

A downstream layer must not silently override a decision made in an upstream layer. Conflicts require an ADR or an explicit constitution amendment.

## 23. Business Model Principles

Farakhorasan adopts a Hybrid SaaS Revenue Model.

Revenue sources include:

- Base Organization Subscription
- Included Billable Seat Allowance
- Additional Seat Bundles
- Optional Product Add-ons
- Metered Services:
  - AI Usage
  - API Usage
  - Communication Usage, including SMS, WhatsApp, calls, and email
- One-time Onboarding
- Data Migration
- Approved Integrations
- Enterprise Support
- Future Marketplace Take Rate, only after separate validation and approval

Partner-sourced revenue is a channel attribution, not a separate revenue source. Partner commissions and payouts are Channel Cost and must be accounted for separately from product revenue.

## 24. Pricing Principles

Pricing must be:

1. Value-Based
2. Versioned
3. Configurable
4. Auditable
5. Tenant-Aware
6. Partner-Aware
7. Free of hard-coded prices
8. Expanded only after measurable customer value is demonstrated

Current figures, discounts, and package ideas are Pricing Hypotheses, not an official Price List.

## 25. Commercial Rules and Pilot Boundary

The following rules are mandatory:

- Four public Starter, Growth, Professional, and Enterprise plans must not be published before market validation.
- The initial commercial offer is a 30-day Paid Design Partner Pilot for one organization and up to six field users.
- The pilot includes process setup, initial data migration, training, dashboard access, before-and-after KPI measurement, and a final ROI report.
- Pilot pricing is organizational and project-based, not positioned as low-cost per-user CRM pricing.
- After pilot validation, the intended packaging is Core Operations, Scale & Automation, and a contract-specific Enterprise offer.
- Core identity includes CRM, visits, orders, collections, KPI, commission, and foundational rules.
- Billing is independent from RBAC. Seat Type is independent from organizational Role.
- Billable Seat is the billing concept. Its eligibility must be based on configurable, versioned, auditable Business Activity rules.
- Subscription values, discounts, contract periods, included allowances, and true-up rules must be configurable and versioned.
- AI and other variable-cost services are Metered Services.
- Billing Engine, Subscription Management, automated invoicing, Partner Portal, and automated payouts are outside the 30-day MVP.
- MVP billing is manual and supported by an auditable usage export.

## 26. Partner Commercial Model

A Partner can hold one or more independent capabilities:

- Referral
- Resale
- Implementation
- Technology Integration

The future partner model must support versioned agreements, customer attribution, attribution windows, commission rules, renewal eligibility, clawbacks, payout ledgers, and delegated tenant administration with customer authorization and audit logs.

Partner capabilities are not a linear maturity ladder. No Partner Portal or automated payout workflow is approved for the MVP.

## 27. Billing Architecture Principles

Billing is Event-Informed and Ledger-Based.

The target flow is:

Domain Event → Metering Ingestion → Normalized Billable Event → Immutable Usage Ledger → Rating → Invoice Draft → Reconciliation → Invoice Issued

Raw event streams and user tables are not invoice amount sources. The Rating function may read versioned Subscription, PriceBook, Contract, and Entitlement data, while billable usage must be derived from the immutable usage ledger.

Every billable event contract must include at least:

- event_id
- idempotency_key
- tenant_id
- event_type
- occurred_at
- received_at
- source
- schema_version
- quantity
- unit

The event contract is documented now for future compatibility; its broker, ingestion infrastructure, ledger, and automated billing implementation remain outside the MVP.

## 28. Feature Admission Gate

A Product Capability enters the product only when all four conditions are satisfied:

1. Measured Customer Value
2. Reusable Capability
3. Sustainable Unit Economics
4. Product Constitution Alignment

Architecture Enablers such as security, backup, auditability, and observability may use a controlled exception path. Each exception requires a documented risk, owner, budget, review date, and expiry or exit criterion.

Custom development is accepted only when it is reusable, strategically necessary or revenue-generating, aligned with this constitution, and economically sustainable.

## 29. AI Cost Governance

Every AI capability must document:

- Customer Value Hypothesis
- Variable Cost per Unit
- Expected Usage Volume
- Target Gross Margin
- Charging Strategy
- Tenant Budget
- Usage Cap
- Fallback Strategy
- Kill Criteria

Charging may use plan allowance, prepaid usage packs, a fixed add-on, or metered usage. AI must not be added without an explicit cost and margin model.

## 30. Documentation and Change Governance

The Master Specification is the navigation and traceability hub for the documentation system. It does not duplicate detailed rules owned by this constitution or by ADRs.

Material changes must:

1. Identify the canonical owning document.
2. Record a Change Log entry.
3. Create or update an ADR when architecture or long-lived commercial structure changes.
4. Update the Master Specification reference map.
5. Preserve document status independently: an Accepted ADR does not make the entire constitution Accepted.

## 31. Decision Traceability

The following accepted decisions govern this section:

- ADR-006 — Pricing & Revenue Architecture
- ADR-007 — Partner Commercial Model
- ADR-008 — Event-Informed and Ledger-Based Billing
