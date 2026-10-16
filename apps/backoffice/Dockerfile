# Contexto de build: raiz do monorepo
#   docker build -f apps/backoffice/Dockerfile --build-arg NEXT_PUBLIC_ROLE_SYSTEM=admin .
#
# Imagens base FIXADAS POR DIGEST (cadeia de suprimentos: a tag pode mudar sem aviso). O Dependabot
# (.github/dependabot.yml) abre PR para atualizar o digest; para subir à mão:
#   docker pull node:24-alpine && docker image inspect node:24-alpine --format '{{index .RepoDigests 0}}'
# O runtime é alpine:3.24 (mesma versão do Alpine da imagem do Node) com só o binário do Node.
FROM oven/bun:1.4.3-alpine@sha256:629e17411f1f129dbec3af78d5af9c9f2a937435c80349437206c6b0b7422373 AS bun

FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS base
# bun só nos estágios de build (copiado da imagem oficial, sem `npm install -g`).
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune @segwise/backoffice --docker

FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=pruner /app/out/full/ .

# Só o que o build precisa e é igual entre commits (role e URL da API): o SHA do commit NÃO entra aqui,
# senão o `next build` rodaria de novo a cada commit e as camadas do backoffice nunca seriam reaproveitadas.
ARG NEXT_PUBLIC_ROLE_SYSTEM
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ROLE_SYSTEM=$NEXT_PUBLIC_ROLE_SYSTEM \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1

# O `sharp` (otimização do next/image) vem nas duas variantes de libc; o runtime é Alpine (musl) e só
# carrega a `linuxmusl`. A variante glibc (~18 MB de libvips) sai do standalone.
RUN bun run --cwd packages/core build \
 && bun run --cwd apps/backoffice build \
 && rm -rf apps/backoffice/.next/standalone/node_modules/.bun/@img+sharp-linux-x64@* \
           apps/backoffice/.next/standalone/node_modules/.bun/@img+sharp-libvips-linux-x64@*

# Runtime: Alpine limpo + só o binário do Node (copiado da imagem oficial, mesma versão do build). A
# imagem node:alpine traz npm, npx, corepack, yarn e headers numa camada da base; apagá-los numa camada
# posterior não diminui nada (continuam na camada de baixo). O Node só precisa de libstdc++/libgcc.
# `apk upgrade` traz os patches de segurança do Alpine publicados depois da imagem base.
FROM alpine:3.24@sha256:294b683cb724975bec92580e1e685676bd4b50bda910ddb8c51d4cabeaec77e6 AS runner
WORKDIR /app

RUN apk upgrade --no-cache \
 && apk add --no-cache libstdc++ \
 && addgroup -g 1000 node \
 && adduser -u 1000 -G node -s /bin/sh -D node

COPY --from=base /usr/local/bin/node /usr/local/bin/node

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
RUN mkdir -p /app/apps/backoffice/.next/cache && chown -R node:node /app/apps/backoffice/.next/cache

USER node
EXPOSE 3000

CMD ["node", "apps/backoffice/server.js"]

# SHA do commit desta imagem: o proxy (src/proxy.ts) o devolve no header X-App-Version, lido em tempo de
# execução. Por último e só como ENV, para não invalidar nenhuma camada anterior.
ARG GIT_SHA=unknown
ENV APP_VERSION=$GIT_SHA
