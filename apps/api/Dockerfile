FROM oven/bun:1.3.5-alpine AS base

FROM base AS deps
WORKDIR /app

COPY package.json bun.lock* .npmrc ./

RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run db:generate
# RUN bun run build

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

COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock* ./
COPY --from=builder /app/.npmrc ./

RUN bun --bun install --frozen-lockfile --production

# COPY --from=builder /app/dist ./
COPY --from=builder /app/src ./src

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/tsconfig.json ./

COPY --from=builder /app/generated ./generated

COPY --from=builder /app/entrypoint.sh ./

RUN chown -R appuser:appgroup /app
RUN mkdir -p /home/appuser/.cache && chown -R appuser:appgroup /home/appuser

USER appuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]