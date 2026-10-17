# Contexto de build: raiz do monorepo
#   docker build -f apps/backoffice/Dockerfile --build-arg NEXT_PUBLIC_ROLE_SYSTEM=admin .
#
# Build e runtime no Bun, na MESMA imagem base da api e do migrate (fixada pelo mesmo digest; o Bun
# é atualizado à mão nos quatro lugares, ver .github/dependabot.yml). O `next build` roda no Bun
# (`bun --bun`, script build do apps/backoffice): as páginas pré-renderizadas no build e as renderizadas
# em runtime saem do mesmo motor (ex.: formatação Intl em pt-BR).
FROM oven/bun:1.4.3-alpine@sha256:629e17411f1f129dbec3af78d5af9c9f2a937435c80349437206c6b0b7422373 AS base

FROM base AS pruner
WORKDIR /app
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune @segwise/backoffice --docker

FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=pruner /app/out/full/ .

# Só o que o build precisa e é igual entre commits (role e URL da API): o SHA do commit NÃO entra aqui,
# senão o `next build` rodaria de novo a cada commit e as camadas do backoffice nunca seriam reaproveitadas.
# API_INTERNAL_URL: destino do rewrite `/api/*` (next.config.ts), que o Next fixa no build. É o endereço
# da api na rede interna do compose (deploy/docker-compose.yml, apelido `segwise-api`).
ARG NEXT_PUBLIC_ROLE_SYSTEM
ARG NEXT_PUBLIC_API_URL
ARG API_INTERNAL_URL=http://segwise-api:3000/services
ENV NEXT_PUBLIC_ROLE_SYSTEM=$NEXT_PUBLIC_ROLE_SYSTEM \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    API_INTERNAL_URL=$API_INTERNAL_URL \
    NEXT_TELEMETRY_DISABLED=1

# O `sharp` (otimização do next/image) vem nas duas variantes de libc; o runtime é Alpine (musl) e só
# carrega a `linuxmusl`. A variante glibc (~18 MB de libvips) sai do standalone.
RUN bun run --cwd packages/core build \
 && bun run --cwd apps/backoffice build \
 && rm -rf apps/backoffice/.next/standalone/node_modules/.bun/@img+sharp-linux-x64@* \
           apps/backoffice/.next/standalone/node_modules/.bun/@img+sharp-libvips-linux-x64@*

# Runtime: Bun, na MESMA imagem base da api e do migrate (mesmo digest). No servidor as camadas do Alpine
# e do Bun já existem por causa da api, então cada imagem web só traz o próprio app (~17 MB). O Next.js
# reconhece o Bun (adaptador verificado desde a 16.2); aqui o `server.js` do standalone roda direto no
# Bun, o caminho do guia de Docker do Bun. Para voltar ao Node: base `node:24-alpine`, script build sem
# `bun --bun` e `CMD ["node", ...]` (e o healthcheck do compose com `node`).
FROM base AS runner
WORKDIR /app

# Patches de segurança do Alpine publicados depois da imagem base.
RUN apk upgrade --no-cache

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# standalone com outputFileTracingRoot na raiz: o server.js fica em apps/backoffice/.
# O código pertence ao root e é só leitura para o usuário da aplicação: um processo comprometido
# não consegue alterar o próprio código.
COPY --from=builder /app/apps/backoffice/.next/standalone ./
COPY --from=builder /app/apps/backoffice/.next/static ./apps/backoffice/.next/static
COPY --from=builder /app/apps/backoffice/public ./apps/backoffice/public

# Único caminho gravável: o cache do Next (no compose é um tmpfs, com o resto do sistema em leitura).
RUN mkdir -p /app/apps/backoffice/.next/cache && chown -R bun:bun /app/apps/backoffice/.next/cache

# Usuário `bun` da imagem base (uid 1000, o mesmo do tmpfs do .next/cache no compose).
USER bun
EXPOSE 3000

CMD ["bun", "apps/backoffice/server.js"]

# SHA do commit desta imagem: o proxy (src/proxy.ts) o devolve no header X-App-Version, lido em tempo de
# execução. Por último e só como ENV, para não invalidar nenhuma camada anterior.
ARG GIT_SHA=unknown
ENV APP_VERSION=$GIT_SHA
