FROM node:22-alpine AS builder

WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @workspace/nadraan add -D @rollup/rollup-linux-x64-musl || pnpm add -w -D @rollup/rollup-linux-x64-musl
RUN pnpm --filter @workspace/nadraan run build

FROM nginx:alpine AS runner
COPY --from=builder /app/artifacts/nadraan/dist/public /usr/share/nginx/html
COPY artifacts/nadraan/nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
