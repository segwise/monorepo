# Contexto de build: raiz do monorepo
#   docker build -f packages/database/Dockerfile .
#
# Imagem das MIGRATIONS (`prisma migrate deploy`). No compose roda uma vez a cada deploy, antes da api
# (`depends_on: service_completed_successfully`). Assim a api não carrega o CLI do Prisma (~200 MB entre
# CLI, engines, studio e dependências) nem pode, se comprometida, rodar comandos de schema no banco.
#
# Mesma base da api (fixada por digest): no servidor as camadas do Bun e do Alpine são compartilhadas.
FROM oven/bun:1.4.3-alpine@sha256:629e17411f1f129dbec3af78d5af9c9f2a937435c80349437206c6b0b7422373 AS base

FROM base AS pruner
WORKDIR /app
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune @segwise/database --docker

# O `migrate deploy` só precisa do CLI e das engines. O client do Prisma (runtime de todos os bancos),
# o Studio e o servidor de banco embutido do `prisma dev` (PGlite) não são usados aqui.
FROM base AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile --production \
 && rm -rf node_modules/.bun/@prisma+client@* \
           node_modules/.bun/@prisma+studio-core@* \
           node_modules/.bun/@prisma+dev@* \
           node_modules/.bun/@electric-sql+pglite@* \
           node_modules/.bun/typescript@* \
 && find node_modules/.bun -type f \( -name '*.d.ts' -o -name '*.d.mts' -o -name '*.d.cts' \
      -o -name '*.map' -o -name '*.md' -o -name '*.markdown' \) -delete

FROM base AS runner
WORKDIR /app

RUN apk upgrade --no-cache

RUN addgroup -S -g 10001 appgroup && adduser -S -u 10001 -G appgroup appuser

# Dependências (camada grande, só muda com o lockfile) e depois schema + migrations (pequena).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=pruner /app/out/full/packages/database/package.json /app/out/full/packages/database/prisma.config.ts ./packages/database/
COPY --from=pruner /app/out/full/packages/database/prisma ./packages/database/prisma

WORKDIR /app/packages/database
USER appuser

# Sem telemetria/checagem de versão do Prisma (o container nem precisa de internet para migrar).
ENV NODE_ENV=production \
    CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1

CMD ["bun", "--bun", "run", "deploy"]

ARG GIT_SHA=unknown
ENV APP_VERSION=$GIT_SHA
