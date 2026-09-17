# Sprint 0 Execution & Repository Baseline

## Purpose / Overview
**Version:** 0.9-RC  
**Status:** Release Candidate — Target Verification Pending  
**Date:** 2026-08-04

هدف: ایجاد حداقل بنیاد مهندسی برای شروع MVP بدون Message Broker، Microservices، Billing Engine، Partner Portal یا Builder عمومی.

## Architecture / Technical Context
مطابق ADR-0001، پشته فنیِ اجرایی و قطعی پروژه **React 19, Vite, Express 5, PostgreSQL, Drizzle ORM, و OpenAPI** است.
*(موارد تاریخی مربوط به طراحی اولیه، مانند FastAPI/Next.js، صرفاً ارزش تاریخی دارند و در این خط مبنا نامعتبر و منسوخ شده‌اند).*
- PostgreSQL in Docker؛
- Modular Monolith
- In-process Domain Event Dispatcher
- PBKDF2 password hashing + JWT
- Append-oriented Audit Log
- Docker Compose و PowerShell operations

## Verification / Completed Outputs
- Repository و Branch/PR policy
- Bounded Context package boundaries
- Authentication foundation و `/api/auth/me`
- API/error conventions
- Structured logging، Request ID، health/readiness
- Seed roles/admin
- Backup/Restore scripts

*Validation Note (Historical/Mock):* Tests pass locally outside Docker, but Target Environment Verification via Docker Compose is required.

## Next Steps / Remaining Freeze Gates (Checkpoint 1.7)
1. Frontend dependency install و production build
2. Docker Compose build/up
3. Backend tests inside container
4. Host health/readiness
5. Database backup
6. Database restore
7. Seed Admin login
8. Password rotation

*(تمامی این گیت‌ها در `scripts/Verify-Sprint0.ps1` پیاده‌سازی شده‌اند اما روی محیط هدف اجرا و تأیید نهایی نشده‌اند).*

## Scope Compliance
Billing Engine، Broker، Outbox، Partner Portal، Microservices، Autonomous AI، Redis/Celery/MinIO و Rule Builder صریحاً غایب هستند.

## Current Status (Conclusion)
Sprint 0 Candidate تکمیل شده (ACTIVE)، اما Checkpoint 1.7 تا زمان انجام عملیات Target Verification **Blocked (Frozen نمی‌شود)**.
