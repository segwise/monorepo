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

RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libgtk-3-0 \
    libasound2

RUN bun x playwright install --with-deps

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

RUN addgroup -S user && adduser -S -G user user
RUN chown -R user:user /app
USER user

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]