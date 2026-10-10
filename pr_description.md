🎯 **What:**
Improved type safety in the order processing logic by removing the `any` type assertion from `originalItem` in the `aggregatedItems` Map.

💡 **Why:**
Using `any` circumvents TypeScript's type checking, masking potential type mismatches and bugs. By correctly inferring the type from `items` (using `(typeof items)[0]`), we ensure that `originalItem` properly maintains its shape strictly defined by `CreateOrderBody`. This makes the code more maintainable and readable.

✅ **Verification:**
- Ran the TypeScript compiler (`pnpm run typecheck`) to confirm types are properly inferred without errors.
- Ran `vitest` tests for `api-server` (expected DB sandbox errors occurred, but no compilation/syntax issues arose).
- Reviewed the exact git diff to ensure behavioral logic remained completely untouched.

✨ **Result:**
The type system now correctly enforces the structure of `originalItem` instead of falling back to `any`. This resolves the identified code health issue cleanly.
