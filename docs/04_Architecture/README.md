# 04_Architecture

System architecture, service boundaries, integration patterns, security model, observability, and non-functional architecture live here.

## Current Baseline

- Modular Monolith with explicit Bounded Contexts
- Microservices deferred pending measured need and a separate ADR
- Pricing architecture governed by ADR-006
- Partner commercial model governed by ADR-007
- Future billing flow governed by ADR-008
- Billing Engine, Message Broker introduced only for billing, Partner Portal, and automated payouts remain outside the 30-day MVP

## Planned Files

- Architecture.md
- Security-Model.md
- Integration-Map.md
- Billing-Architecture.md, only when the Billing Foundation roadmap gate is opened
