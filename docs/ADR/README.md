# Architecture Decision Records (ADRs) — فروشیار پلاس

این دایرکتوری شامل اسناد ثبت تصمیمات معماری، حاکمیتی و محصولی پروژه فروشیار پلاس است.

## فهرست تصمیمات (ADR Index)

| شناسه | عنوان | وضعیت | دسته‌بندی |
|---|---|---|---|
| [ADR-0001](./ADR-0001.md) | **Stack Authority & Documentation Reference** | Accepted | Governance / Architecture |
| [ADR-001](./ADR-001.md) | **Rule Engine outside application code** | Proposed | Architecture |
| [ADR-002](./ADR-002.md) | **Policy Engine independent from Rule Engine** | Proposed | Architecture |
| [ADR-003](./ADR-003.md) | **Commission handled by Rule Engine** | Proposed | Business Logic |
| [ADR-004](./ADR-004.md) | **AI acts only as an assistant** | Proposed | AI Governance |
| *ADR-005* | *(رزرو شده / ثبت نشده)* | — | — |
| [ADR-006](./ADR-006.md) | **Pricing & Revenue Architecture** | Accepted | Commercial / Billing |
| [ADR-007](./ADR-007.md) | **Partner Commercial Model** | Accepted | Business Model |
| [ADR-008](./ADR-008.md) | **Event-Informed and Ledger-Based Billing** | Accepted | Architecture / Billing |
| [ADR-009](./ADR-009.md) | **Farakhorasan Platform / Forooshyar Sales Boundary & Product Naming** | Proposed | Governance / Scope |
| [ADR-010](./ADR-010.md) | **Forooshyar Plus Capability Integration** | Accepted | Product / Scope |
| [ADR-011](./ADR-011.md) | **Forooshyar Plus Product Naming** | Accepted | Governance / Brand |

> [!NOTE]
> شناسه `ADR-0001` به عنوان سند پایه حاکمیت تکنولوژی (Stack Authority) ۴ رقمی نام‌گذاری شده و با `ADR-001` (موتور قوانین) متفاوت است. مرجع پشته فنی رسمی مخزن طبق ADR-0001 پشته جاری یعنی `React 19, Express 5, PostgreSQL, Drizzle ORM` است.
