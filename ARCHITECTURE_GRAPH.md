# Architecture Graphs

## Evidence and Verification Status

The diagrams below are derived from code inspection of the actual repository state.

*   **VERIFIED**: Supported by current source code, Drizzle schemas, OpenAPI contracts, and Express API routes.
*   **PLANNED / MVP DOMAIN**: Defined in `docs/00_Project/Roadmap.md` and `PROJECT_STATE.md` but not yet fully implemented in code.
*   **TBD**: Not verifiable from the current repository.

---

## A. High-level System / Context Diagram

```mermaid
graph TD
    subgraph Frontend [React 19 + Vite Frontend]
        UI_Dash[Dashboards - PLANNED]
        UI_Sales[Sales & Orders - VERIFIED]
        UI_Cat[Catalog & Pricing - VERIFIED]
        UI_Cust[Customers - VERIFIED]
        UI_Auth[Authentication - VERIFIED]
    end

    subgraph API [Express 5 API Server]
        API_GW[API Router & OpenAPI Contract - VERIFIED]
    end

    subgraph Domains [Bounded Contexts]
        D_Auth[Authentication & Access - VERIFIED]
        D_Sales[Sales Core - VERIFIED]
        D_Catalog[Products & Pricing - VERIFIED]
        D_Cust[Customers & CRM - VERIFIED]
        D_Perf[Performance & KPI - PLANNED]
        D_Comm[Commission & Collections - PLANNED]
        D_Dec[Decision Layer & Reports - PLANNED]
    end

    subgraph Infrastructure [Data & Infrastructure]
        DB[(PostgreSQL + Drizzle - VERIFIED)]
        Logs[Structured Logging Pino - VERIFIED]
    end

    Frontend -->|Orval + React Query / OpenAPI| API
    API --> API_GW

    API_GW --> D_Auth
    API_GW --> D_Sales
    API_GW --> D_Catalog
    API_GW --> D_Cust
    API_GW -.-> D_Perf
    API_GW -.-> D_Comm
    API_GW -.-> D_Dec

    D_Auth --> DB
    D_Sales --> DB
    D_Catalog --> DB
    D_Cust --> DB

    Domains --> Logs
```

## B. Database ER Diagram

> Derived directly from `lib/db/src/schema` (Drizzle definitions).

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "places"
    CUSTOMERS ||--o{ ORDERS : "makes"

    USERS {
        integer id PK
        text username
        text password
        text name
        text role
        timestamp created_at
        timestamp deleted_at
    }

    CUSTOMERS {
        integer id PK
        text code
        text name
        text type
        text route
        text address
        timestamp created_at
        timestamp deleted_at
    }

    PRODUCTS {
        integer id PK
        text code
        text name
        text category
        text pack
        text unit
        integer price
        text image
        timestamp created_at
        timestamp deleted_at
    }

    ORDERS {
        integer id PK
        text code
        integer customer_id FK
        text customer_name
        integer user_id FK
        text rep_name
        integer total
        text status
        jsonb items
        timestamp created_at
        timestamp deleted_at
    }
```

*(Note: `ORDER_ITEMS` is modeled as a `jsonb` array inside `ORDERS` in this specific implementation, as verified in `orders.ts`)*

## C. Request / Data Flow Sequence

> Generic verified request flow observed in the current codebase for authenticated data retrieval and insertion.

```mermaid
sequenceDiagram
    actor Rep as Sales Rep
    participant UI as React + Orval Client (VERIFIED)
    participant API as Express Routes (VERIFIED)
    participant Auth as Auth Middleware (VERIFIED)
    participant Ctx as Domain Route/Logic (VERIFIED)
    participant DB as PostgreSQL (VERIFIED)

    Rep->>UI: Input credentials
    UI->>API: POST /auth/login
    API->>DB: Query User
    DB-->>API: User Record
    API-->>UI: JWT Token

    Note over Rep,DB: Authenticated Session Established

    Rep->>UI: Submit Action (e.g. Create Order)
    UI->>API: POST /api/orders (with JWT)
    API->>Auth: Validate JWT
    Auth-->>API: OK
    API->>Ctx: Process Domain Logic
    Ctx->>DB: Drizzle insert/select (Transaction)
    DB-->>Ctx: Database Response
    Ctx-->>API: Response Payload
    API-->>UI: 200 OK Response
    UI-->>Rep: State updated & visual feedback
```
