# Sprint 0 Execution & Repository Baseline

**Version:** 0.9-RC  
**Status:** Release Candidate — Target Verification Pending  
**Date:** 2026-08-04

## Goal

ایجاد حداقل بنیاد مهندسی برای شروع MVP بدون Message Broker، Microservices، Billing Engine، Partner Portal یا Builder عمومی.

## Candidate Technical Baseline (Historical Record)

> **هشدار (Stack Divergence Warning):** موارد زیر مربوط به طراحی اولیه (Candidate Technical Baseline) بوده و اکنون صرفاً ارزش تاریخی دارند. مطابق ADR-0001، پشته فنیِ اجرایی و قطعی پروژه **React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, و OpenAPI** است و هرگونه ارجاع به FastAPI یا Next.js نامعتبر است.

- FastAPI + SQLAlchemy 2 + Alembic (Historical)
- PostgreSQL in Docker؛ SQLite فقط برای تست محلی
- Next.js + TypeScript + RTL foundation (Historical)
- Modular Monolith
- In-process Domain Event Dispatcher
- PBKDF2 password hashing + JWT
- Append-oriented Audit Log
- Docker Compose و PowerShell operations

## Completed Outputs

- Repository و Branch/PR policy
- Bounded Context package boundaries
- Migration baseline `20260804_0001`
- Authentication foundation و `/auth/me`
- API/error conventions
- Audit login success/failure
- Structured logging، Request ID، health/readiness
- Seed roles/admin
- CI definition
- Backup/Restore scripts
- Sprint 1 Board

## Validation

```text
Alembic migration: PASS
Seed: PASS
Python compile: PASS
Pytest: 7 passed
```

## Remaining Freeze Gates

1. Frontend dependency install و production build
2. Docker Compose build/up
3. Backend tests inside container
4. Host health/readiness
5. Database backup
6. Database restore
7. Seed Admin login
8. Password rotation

## Stack Decision Warning

این Candidate با Stack فعلی مخزن اصلی متفاوت است. مخزن فعلی Express/Vite/Drizzle است. هیچ جایگزینی یا Merge کد تا تصویب ADR مهاجرت Stack مجاز نیست.

## Scope Compliance

Billing Engine، Broker، Outbox، Partner Portal، Microservices، Autonomous AI، Redis/Celery/MinIO و Rule Builder غایب هستند.

## Decision

Sprint 0 Candidate تکمیل شده، اما Checkpoint 1.7 تا Target Verification **Frozen نمی‌شود**.
