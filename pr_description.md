## 🧹 [Code Health] Remove any cast for bulkStatus in orders.tsx

### 🎯 What:
Removed the `as any` casts used when updating the `status` field for orders in `artifacts/nadraan/src/pages/orders.tsx`. The API client exposes an `OrderStatus` type which has been imported and used for type casting to provide better safety and adherence to the schema.

### 💡 Why:
The `status` field has a specific set of allowed values defined by the API schema (e.g. "در انتظار", "تایید شده", "تکمیل شده", "لغو شده"). Casting to `any` weakened type safety, bypassed TypeScript compiler checks, and made the codebase less maintainable. Explicit typing prevents accidental assignments of incorrect strings that might result in API errors or UI bugs down the line.

### ✅ Verification:
- Read `orders.tsx` and identified both locations where `as any` was used for `status` mutations.
- Checked the `@workspace/api-client-react` schemas and found the exact `OrderStatus` enum/type.
- Imported `OrderStatus` and replaced `as any` in `applyBulkStatus` and the inline table row update handler.
- Run `pnpm install`, `pnpm run typecheck:libs`, and then specifically verified `pnpm --filter @workspace/nadraan run typecheck` which completed successfully with no errors.

### ✨ Result:
Improved static analysis and type-safety across the file without changing any runtime behavior. The codebase is now safer and cleaner!
