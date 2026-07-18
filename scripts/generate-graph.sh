#!/usr/bin/env bash
# Regenerates the codebase knowledge graph (graphify-out/) using Graphify.
# No API key needed — runs fully local/offline against the current source tree.
#
# Usage:
#   pnpm run graph:generate
#   (or directly)  bash scripts/generate-graph.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v graphify >/dev/null 2>&1; then
  echo "graphify CLI not found — installing (pip install graphifyy)..."
  pip install --quiet graphifyy
fi

echo "→ Extracting code graph..."
graphify extract . --code-only --no-cluster

echo "→ Clustering into subsystems..."
graphify cluster-only . --no-label

echo "✔ Done. Open graphify-out/graph.html in a browser, or read graphify-out/GRAPH_REPORT.md."
