FROM node:22-alpine AS builder

WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @workspace/nadraan run build

FROM nginx:alpine AS runner
COPY --from=builder /app/artifacts/nadraan/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
