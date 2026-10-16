# Contexto de build: raiz do monorepo
#   docker build -f apps/api/Dockerfile .
#
# Camadas pensadas para o deploy baixar pouco: o node_modules (grande, só muda quando o lockfile
# muda) fica numa camada própria, ANTES do código (pequeno, muda a cada commit). Só dependências
# de produção vão para a imagem (sem Biome, turbo, TypeScript, @react-email/ui + next etc.).
FROM oven/bun:1.4.2-alpine AS base

FROM base AS pruner
WORKDIR /app
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune @segwise/api --docker

# Só dependências de produção (o runtime precisa do prisma CLI para o `migrate deploy` do
# entrypoint: por isso ele é `dependency` do @segwise/database).
FROM base AS prod-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile --production \
    # O better-auth declara `next` como peer opcional e o Bun o liga ao next do lockfile (que vem do
    # @react-email/ui, devDependency de preview). A api usa o better-auth com Hono e nunca importa
    # `next` nem `better-auth/next-js`: ~370 MB (next + binários SWC) que só atrasam o pull.
 && rm -rf /app/node_modules/.bun/next@* /app/node_modules/.bun/@next+swc-*

FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN bun run --cwd packages/core build \
 && bun run --cwd packages/database generate
# Código e artefatos de build SEM node_modules: é a camada pequena que muda a cada commit.
RUN mkdir /artifact \
 && cp package.json /artifact/ \
 && cp -r apps packages /artifact/ \
 && find /artifact -name node_modules -type d -prune -exec rm -rf {} +

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

# 1) dependências (camada grande e estável) e os links de cada workspace (pequenos)
COPY --from=prod-deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=prod-deps --chown=appuser:appgroup /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps --chown=appuser:appgroup /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=prod-deps --chown=appuser:appgroup /app/packages/database/node_modules ./packages/database/node_modules

# 2) código + build do core + client Prisma gerado (camada pequena, muda a cada commit)
COPY --from=builder --chown=appuser:appgroup /artifact/ ./

RUN mkdir -p /home/appuser/.cache && chown -R appuser:appgroup /home/appuser

WORKDIR /app/apps/api

USER appuser

ENV NODE_ENV=production
ENV TZ=UTC
ENV PORT=3000

EXPOSE 3000

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]

# SHA do commit desta imagem: sai no header X-App-Version (ver middlewares/version.ts). Por último
# (e só como ENV, sem RUN depois) para não invalidar nenhuma camada anterior.
ARG GIT_SHA=unknown
ENV APP_VERSION=$GIT_SHA
