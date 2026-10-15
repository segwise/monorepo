# Contexto de build: raiz do monorepo
#   docker build -f apps/api/Dockerfile .
FROM oven/bun:1.4.2-alpine AS base

FROM base AS pruner
WORKDIR /app
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune @segwise/api --docker

FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN bun run --cwd packages/core build \
 && bun run --cwd packages/database generate

FROM base AS runner
WORKDIR /app

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    ca-certificates \
    libstdc++ \
    udev \
    dbus \
    dumb-init \
    mesa-gl \
    libx11 \
    libxcomposite \
    libxdamage \
    libxrandr \
    libxkbcommon \
    libxshmfence \
    alsa-lib

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

ENV PLAYWRIGHT_BROWSERS_PATH=0 \
    CHROMIUM_PATH=/usr/bin/chromium-browser

COPY --from=builder --chown=appuser:appgroup /app ./

RUN mkdir -p /home/appuser/.cache && chown -R appuser:appgroup /home/appuser

WORKDIR /app/apps/api

USER appuser

ENV NODE_ENV=production
ENV TZ=UTC
ENV PORT=3000

EXPOSE 3000

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
