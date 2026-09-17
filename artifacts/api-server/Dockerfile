# syntax=docker/dockerfile:1

# ---- Dependencies Stage ----
# Installs the full pnpm workspace (all packages) with a frozen lockfile so
# the build is reproducible on any host (Docker Desktop or a Linux VPS),
# independent of whatever happens to be in the host's node_modules.
FROM node:22-slim AS deps
RUN npm install -g pnpm@11.21.0
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY lib/db/package.json ./lib/db/package.json
COPY lib/api-zod/package.json ./lib/api-zod/package.json
RUN pnpm install --frozen-lockfile --prod=false --filter "@workspace/api-server..."

# ---- Build Stage ----
FROM deps AS builder
COPY tsconfig.base.json tsconfig.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY lib/db ./lib/db
COPY lib/api-zod ./lib/api-zod
COPY artifacts/api-server ./artifacts/api-server
COPY --from=deps /app/lib/db/node_modules ./lib/db/node_modules
COPY --from=deps /app/lib/api-zod/node_modules ./lib/api-zod/node_modules
COPY --from=deps /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules
RUN pnpm --filter @workspace/api-server run build

# ---- Tester Stage (for GATE-1.7-03 — runs the real vitest suite) ----
FROM builder AS tester
WORKDIR /app/artifacts/api-server
CMD ["pnpm", "test"]

# ---- Runner Stage (Production Runtime) ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/artifacts/api-server/dist ./dist
EXPOSE 3000
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
