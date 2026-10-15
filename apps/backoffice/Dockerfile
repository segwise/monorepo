
FROM node:22.14-alpine AS base

WORKDIR /app

RUN npm install -g bun@1.3.2

FROM base AS builder

WORKDIR /app

COPY package.json bun.lock* .npmrc ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM base AS pruner

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock* ./
COPY --from=builder /app/.npmrc ./

RUN bun install --production --frozen-lockfile

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

FROM node:22.14.0-alpine AS runner

WORKDIR /app

COPY --from=pruner /app ./

CMD ["node", "server.js"]