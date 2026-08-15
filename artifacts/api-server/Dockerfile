FROM node:22-alpine AS builder

WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile=false
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY --from=builder /app/lib ./lib

EXPOSE 3000
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
