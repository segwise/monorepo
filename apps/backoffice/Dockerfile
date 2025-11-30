
FROM node:22.14-alpine AS base

WORKDIR /app

RUN npm install -g bun@1.3.2

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

ARG NEXT_PUBLIC_BETTER_AUTH_URL
ARG BETTER_AUTH_SECRET

ENV NEXT_PUBLIC_BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL \
    BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET \
    PORT=3000 \
    NODE_ENV=production

CMD ["node", "server.js"]
