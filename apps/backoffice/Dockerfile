# Contexto de build: raiz do monorepo
#   docker build -f apps/backoffice/Dockerfile --build-arg NEXT_PUBLIC_ROLE_SYSTEM=admin .
#
# Imagens base FIXADAS POR DIGEST (cadeia de suprimentos: a tag pode mudar sem aviso). O Dependabot
# (.github/dependabot.yml) abre PR para atualizar o digest; para subir à mão:
#   docker pull node:24-alpine && docker image inspect node:24-alpine --format '{{index .RepoDigests 0}}'
FROM oven/bun:1.4.2-alpine@sha256:d888c0ae6c86d7866ff10c5aafdd9077b36aee6455b33dd270fb93c0dd5cef6f AS bun

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

ARG NEXT_PUBLIC_ROLE_SYSTEM
ARG NEXT_PUBLIC_API_URL
# SHA do commit: next.config.ts o embute no header X-App-Version (lido no build, não em runtime).
ARG GIT_SHA=unknown
ENV NEXT_PUBLIC_ROLE_SYSTEM=$NEXT_PUBLIC_ROLE_SYSTEM \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    APP_VERSION=$GIT_SHA \
    NEXT_TELEMETRY_DISABLED=1

RUN bun run --cwd packages/core build \
 && bun run --cwd apps/backoffice build

FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS runner
WORKDIR /app

# Hardening do runtime:
#  - `apk upgrade` traz os patches de segurança do Alpine publicados depois da imagem base;
#  - sem npm, yarn nem corepack: o servidor só executa `node`, e o npm embutido trazia pacotes
#    vulneráveis (ex.: tar) e uma superfície de ataque que a aplicação não usa.
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
           /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

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
