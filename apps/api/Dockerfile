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
RUN bun run build

FROM base AS runner
WORKDIR /app

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    fontconfig \
    libstdc++ \
    && rm -rf /var/cache/apk/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROME_BIN=/usr/bin/chromium-browser \
    PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock* ./
COPY --from=builder /app/.npmrc ./

RUN bun --bun install --frozen-lockfile --production

COPY --from=builder /app/dist ./

COPY --from=builder /app/prisma/migrations ./prisma/migrations
COPY --from=builder /app/prisma/schema.prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

COPY --from=builder /app/generated ./generated

COPY --from=builder /app/entrypoint.sh ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]