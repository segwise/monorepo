FROM oven/bun:1.3.2-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* .npmrc ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS prod-deps
COPY package.json bun.lock* .npmrc ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

FROM oven/bun:1.3.2-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

CMD ["bun", "server.js"]