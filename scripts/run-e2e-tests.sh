#!/usr/bin/env bash
set -e

# Setup environment PATH for WSL / Linux if node is in standard user directories
if [ -d "/home/gapcode/.node/bin" ]; then
  export PATH="/home/gapcode/.local/bin:/home/gapcode/.node/bin:$PATH"
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/artifacts/api-server"

echo "================================================================"
echo " Forooshyar Plus — Phase A1 Governance & Workflows E2E Test Suite"
echo "================================================================"
echo "Running 4-Tier Automated Opaque-Box E2E Tests with Vitest..."
echo ""

pnpm vitest run src/test/e2e/ "$@"

TEST_EXIT_CODE=$?

echo ""
echo "================================================================"
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ ALL E2E TESTS PASSED CLEANLY ACROSS ALL 4 TIERS"
else
  echo "❌ E2E TEST FAILURES DETECTED (Exit code: $TEST_EXIT_CODE)"
fi
echo "================================================================"

exit $TEST_EXIT_CODE
