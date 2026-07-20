> ⚠️ راهنمای اصلی این ریپو الان `CLAUDE.md` (روت پروژه) هست — این فایل رو هم بخون.
> وضعیت زنده‌ی پروژه و کارهای باز: `PROJECT_STATUS.md` (روت پروژه).
>
> نکته: دو لینک زیر (`drizzle-execute.md`, `nadraan-auth.md`) اشاره به فایل‌هایی می‌کنن
> که هیچ‌وقت commit نشدن (broken link از یه سشن قدیمی). محتواشون رو می‌تونی توی
> `CLAUDE.md` بخش «نکات فنی مهم» پیدا کنی. اگه لازم شد جزئیات بیشتری اضافه بشه،
> یا این فایل‌ها رو واقعاً بساز یا لینک‌ها رو پاک کن.

- [Drizzle execute vs select](drizzle-execute.md) — `db.execute()` returns `{ rows: [] }` not a spreadable array; use `.rows`
- [Nadraan auth flow](nadraan-auth.md) — JWT in localStorage "nadraan_token"; injected via setAuthTokenGetter at boot; ApiError must be exported from api-client-react index
