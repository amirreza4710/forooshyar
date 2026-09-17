# syntax=docker/dockerfile:1

# ---- Dependencies Stage ----
FROM node:22-slim AS deps
RUN npm install -g pnpm@11.21.0
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY artifacts/nadraan/package.json ./artifacts/nadraan/package.json
COPY lib/api-client-react/package.json ./lib/api-client-react/package.json
RUN pnpm install --frozen-lockfile --filter "@workspace/nadraan..."

# ---- Build Stage ----
FROM deps AS builder
COPY tsconfig.base.json tsconfig.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY lib/api-client-react ./lib/api-client-react
COPY artifacts/nadraan ./artifacts/nadraan
COPY --from=deps /app/artifacts/nadraan/node_modules ./artifacts/nadraan/node_modules
RUN pnpm --filter @workspace/nadraan run build

# ---- Runner Stage ----
FROM nginx:alpine AS runner
COPY --from=builder /app/artifacts/nadraan/dist/public /usr/share/nginx/html
COPY artifacts/nadraan/nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
