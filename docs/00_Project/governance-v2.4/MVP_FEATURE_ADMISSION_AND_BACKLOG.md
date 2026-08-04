# MVP Feature Admission & Backlog v1.0

**Status:** Approved & Frozen  
**Checkpoint:** 1.6  
**New MVP Features:** 0

## Admission Gate

هر Feature باید هم‌زمان این چهار معیار را پاس کند:

1. Customer Value
2. Reusability
3. Sustainable Unit Economics
4. Constitution Alignment

وضعیت‌های مجاز:

- `MVP_COMMITTED`
- `DOCUMENTATION_ONLY`
- `POST_MVP_CANDIDATE`
- `REJECTED_FOR_MVP`

## Frozen MVP Epics

1. Authentication & Access
2. Role-Based Dashboard
3. Customers
4. Products & Pricing
5. Orders
6. Targets
7. KPI
8. Commission
9. Collections
10. Reports
11. Basic Settings

مجموع Featureهای متعهد: **32**.

## Delivery Cut Line

### Sprint 1

- AUTH-F01..F03
- SET-F01..F03
- PRD-F01..F03
- CUS-F01..F03

### Sales Core

- ORD-F01..F03
- TAR-F01..F02

### Performance & Cash

- KPI-F01..F03
- COM-F01..F03
- COL-F01..F03

### Decision Layer

- DASH-F01..F03
- REP-F01..F03

## Architecture Enabler Exceptions

Security، Audit، Backup و Observability فقط با مسیر استثنای مستند، بودجه‌دار و زمان‌دار وارد MVP می‌شوند. این موارد Feature محصول محسوب نمی‌شوند و نباید به Builder یا Platform عمومی تبدیل شوند.

## Explicit Rejections for MVP

- Billing Engine
- Automated Metering/Rating/Invoice/Reconciliation
- Message Broker و Transactional Outbox
- Partner Portal
- Automated Partner Commission/Payout
- Marketplace
- Microservices
- Autonomous AI Agents
- General Rule/Workflow Builder

## Cut Policy Under Pressure

ابتدا نمودارها، شخصی‌سازی، فیلترهای فرعی، تعداد گزارش‌ها و Exportهای غیرضروری کاهش می‌یابند. Authentication، Permission، Customers، Products، Orders، Data Integrity و Audit حذف نمی‌شوند.

## Change Rule

هر Feature جدید به‌صورت پیش‌فرض `POST_MVP_CANDIDATE` است و فقط با Decision Record و بازنگری رسمی Scope می‌تواند وارد MVP شود.
