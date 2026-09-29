# AGENTS.md — Forooshyar Plus

این دستورالعمل برای همهٔ دستیارهای هوش مصنوعی در کل مخزن اعمال می‌شود.

## مرجع حقیقت و محدوده کار

نام محصول **فروشیار پلاس / Forooshyar Plus** است. بازارک نام منبع قابلیت‌های Field Operations و Automation در این محصول است، نه محصول مستقل.

پیش از هر تغییر، به‌ترتیب بخوانید: `PROJECT_STATE.md`، این فایل، `README.md`، `docs/00_Project/governance-v2.4/README.md`، `docs/00_Project/Roadmap.md` و `docs/README.md`.

`docs/` مرجع محصول، کسب‌وکار، UX، معماری و توسعه است. قابلیت جدید پیش‌فرض `POST_MVP_CANDIDATE` است. تغییر معماری، دامنه، چندسازمانی یا قرارداد عمومی بدون ADR پذیرفته‌شده، Scope Review و معیار پذیرش مجاز نیست. فقط روی Workstream فعال کار کنید و تغییرات کوچک، متمرکز و قابل بازگشت نگه دارید.

## ساختار کد

| مسیر | مسئولیت |
|---|---|
| `artifacts/api-server/` | Express 5 API، routeها، middleware و تست‌های Vitest/Supertest |
| `artifacts/nadraan/` | React 19 + Vite frontend، صفحه‌ها، layout و UI |
| `lib/api-spec/openapi.yaml` | قرارداد canonical API |
| `lib/api-zod/` | validatorها و typeهای تولیدشده از OpenAPI |
| `lib/api-client-react/` | React Query client تولیدشده و `custom-fetch` |
| `lib/db/` | PostgreSQL/Drizzle schema و اتصال دیتابیس |
| `docs/` | مستندات canonical و ADRها |
| `scripts/` | seed، backup/restore و verification |

## وضعیت فعلی (Checkpoint 1.7 - FROZEN)

پایه فنی پروژه، زیرساخت‌ها، ابزارها و تست‌های هسته (Checkpoint 1.7) به طور کامل تأیید و فریز (FROZEN) شده‌اند. **هیچ تغییری در چارچوب‌های پایه (Foundation Churn) مجاز نیست.** تمرکز فقط باید روی توسعه عملیاتی Sprint 1 قرار گیرد.

## Build و Test

فقط از `pnpm` استفاده کنید؛ `npm`، `yarn` و lockfileهای آن‌ها مجاز نیستند. `minimumReleaseAge` در `pnpm-workspace.yaml` را تضعیف نکنید.

```bash
pnpm install
pnpm run typecheck
pnpm run build

pnpm --filter @workspace/api-server test
pnpm --filter @workspace/nadraan test
pnpm --filter @workspace/api-client-react test

pnpm --filter @workspace/api-spec codegen
pnpm --filter @workspace/db push
docker compose up --build
```

- پس از تغییر `openapi.yaml`، `codegen` را اجرا و خروجی‌های تولیدشده را همراه تغییر commit کنید.
- `db push` فقط پس از بررسی اثر schema روی محیط هدف اجرا می‌شود. `push-force` بدون تأیید صریح و backup بازیافت‌پذیر ممنوع است.
- پیش از تحویل، دست‌کم `pnpm run typecheck` و test/build مرتبط با تغییر را اجرا کنید. تغییر API یا schema به codegen و تست API هم نیاز دارد.

## قراردادهای Backend و Database

- API contract-first است: OpenAPI → codegen → route Express → UI client.
- routeهای محافظت‌شده از `requireAuth` و عملیات مدیریتی پس از آن از `requireRole` استفاده می‌کنند.
- ورودی‌های route با validatorهای تولیدشدهٔ Zod و `safeParse` اعتبارسنجی شوند؛ خطای ورودی `4xx` است و خطای غیرمنتظره به error handler می‌رود.
- عملیات چندمرحله‌ای، موجودی یا مالی در `db.transaction` انجام می‌شوند. validation و قفل‌گذاری تراکنشی سفارش موجود را تکرار یا دور نزنید.
- `deletedAt` الگوی soft delete است. queryهای domain باید `isNull(...deletedAt)` داشته باشند، مگر برای audit صریح.
- schema فقط در `lib/db/src/schema/` تعریف و از `schema/index.ts` export می‌شود. Foreign key و index queryهای پرتکرار را در schema در نظر بگیرید.
- مرز چندسازمانی اجباری معماری است؛ پیش از افزودن `organization_id` یا تغییر access-control، ADR و معیار پذیرش لازم است.
- Pino، request ID و خط‌مشی عدم ثبت secret/password/token در log حفظ شوند. endpointهای dev/seed نباید در production در دسترس باشند.

## قراردادهای Frontend

- صفحه‌ها در `src/pages/`، layout در `components/layout/` و UI primitives در `components/ui/` هستند.
- برای دادهٔ سرور فقط از client تولیدشده و React Query استفاده کنید؛ fetch یا type دستی موازی برای endpointهای OpenAPI نسازید.
- پس از mutation، query key تولیدشده را invalidate کنید و loading، empty، error و mobile/RTL state را پوشش دهید.
- مسیرهای محافظت‌شده در `App.tsx` و `AuthProvider` باقی می‌مانند.

## تست، امنیت و Git

- تست‌های route کنار همان route و fixtureهای مشترک API در `artifacts/api-server/src/test/fixtures.ts` هستند.
- برای bug یک regression test کوچک اضافه کنید. برای authorization، validation، soft delete، transaction و مرز سازمانی تست منفی هم بنویسید.
- `.env`، secret، token و password هرگز commit یا log نمی‌شوند؛ نام متغیرهای لازم در `.env.example` ثبت می‌شود.
- پیش از commit، `git diff --check`، diff و status را بررسی کنید. تغییرات نامرتبط یا staged متعلق به کاربر را وارد commit نکنید.
- commit، push، branch و PR فقط با درخواست صریح کاربر انجام می‌شوند. مستندات canonical و ADR مرتبط را هم‌زمان با تغییرات محصول/معماری به‌روزرسانی کنید.
