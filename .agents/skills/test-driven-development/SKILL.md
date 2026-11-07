---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---

# Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over.

## Red-Green-Refactor Cycle

1. **RED - Write Failing Test:** Write one minimal test showing what should happen.
2. **Verify RED:** Run the test suite and watch it fail for the expected reason (not a syntax error or typo).
3. **GREEN - Minimal Code:** Write the simplest possible code to make the test pass. No premature abstractions or speculative features.
4. **Verify GREEN:** Run the test suite and ensure it passes, and no regressions exist in the rest of the project.
5. **REFACTOR:** Clean up code, remove duplication, and improve names while keeping tests green.
