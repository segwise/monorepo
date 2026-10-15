# Contexto de build: raiz do monorepo
#   docker build -f apps/backoffice/Dockerfile --build-arg NEXT_PUBLIC_ROLE_SYSTEM=backoffice .
FROM node:22.14-alpine AS base
RUN npm install -g bun@1.4.2

FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune @segwise/backoffice --docker

FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/bunfig.toml ./
RUN bun install --frozen-lockfile
COPY --from=pruner /app/out/full/ .

ARG NEXT_PUBLIC_ROLE_SYSTEM
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ROLE_SYSTEM=$NEXT_PUBLIC_ROLE_SYSTEM \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN bun run --cwd packages/core build \
 && bun run --cwd apps/backoffice build

FROM node:22.14.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# standalone com outputFileTracingRoot na raiz: o server.js fica em apps/backoffice/
COPY --from=builder /app/apps/backoffice/.next/standalone ./
COPY --from=builder /app/apps/backoffice/.next/static ./apps/backoffice/.next/static
COPY --from=builder /app/apps/backoffice/public ./apps/backoffice/public

CMD ["node", "apps/backoffice/server.js"]
