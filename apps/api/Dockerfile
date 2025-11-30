FROM oven/bun:1.3.2 AS base

RUN apt-get update && apt-get install -y \
  python3 \
  python3-pip \
  python3-venv \
  build-essential \
  pkg-config \
  libssl-dev \
  && rm -rf /var/lib/apt/lists/*

FROM base AS builder

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun --bun install --frozen-lockfile

COPY . .

RUN --mount=type=secret,id=database_url,env=DATABASE_URL

RUN bun --bun run db:generate

RUN bun --bun run build

FROM oven/bun:1.3.2-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y \
  openssl \
  python3 \
  python3-pip \
  python3-venv \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock* ./

RUN bun --bun install --frozen-lockfile --production

COPY --from=builder /app/dist ./

COPY --from=builder /app/prisma/migrations ./prisma/migrations
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma.config.js ./

COPY --from=builder /app/src/generated ./src/generated

COPY --from=builder /app/entrypoint.sh ./

RUN chmod +x ./entrypoint.sh

ENV PORT=3000
ENV NODE_ENV=production

ENTRYPOINT ["./entrypoint.sh"]