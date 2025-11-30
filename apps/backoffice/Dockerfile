
FROM oven/bun:1.3.0 AS base

WORKDIR /app

FROM base AS builder

WORKDIR /app

COPY bun.lock* package.json ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM base AS pruner

WORKDIR /app

COPY bun.lock* package.json ./

RUN bun install --production --frozen-lockfile

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

FROM node:22.14.0-alpine AS runner

WORKDIR /app

COPY --from=pruner /app ./

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
