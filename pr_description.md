🎯 **What:**
- Added test coverage for `signToken` and `verifyToken` functions in `artifacts/api-server/src/lib/auth.ts`.
- Previously, these core JWT utility functions were missing tests, reducing confidence in the authentication layer.

📊 **Coverage:**
- Added `signToken should return a string token`: Verifies that signed tokens have the correct structure (3 parts).
- Added `verifyToken should decode and return the payload for a valid token`: Verifies that a valid token is decoded into the correct payload.
- Added `verifyToken should throw an error for an invalid token`: Verifies that invalid tokens correctly throw errors.
- Added `verifyToken should throw an error for an expired token`: Verifies that expired tokens correctly throw `jwt expired` errors.

✨ **Result:**
- Increased test coverage for the authentication library, ensuring token signing and verification work as expected and handle errors properly.
