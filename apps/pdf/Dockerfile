# Contexto de build: raiz do monorepo
#   docker build -f apps/pdf/Dockerfile .
#
# Serviço HTML -> PDF (Chromium + Playwright), isolado da api. A imagem muda pouco: o Chromium fica
# numa camada própria, ANTES das dependências e do código, para o servidor baixá-lo uma vez só
# (cada deploy novo baixa apenas a camada pequena do código).
#
# Imagens base FIXADAS POR DIGEST (cadeia de suprimentos). O Dependabot abre PR para atualizar; à mão:
#   docker pull node:24-alpine && docker image inspect node:24-alpine --format '{{index .RepoDigests 0}}'
FROM oven/bun:1.4.3-alpine@sha256:629e17411f1f129dbec3af78d5af9c9f2a937435c80349437206c6b0b7422373 AS bun

FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS base
# bun só nos estágios de instalação (copiado da imagem oficial, sem `npm install -g`).
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune @segwise/pdf --docker

# Só dependências de produção (playwright-core e zod). O `playwright-core` não baixa navegador.
FROM base AS prod-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile --production

FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS runner
WORKDIR /app

# Patches de segurança do Alpine publicados depois da imagem base; sem npm/yarn/corepack (o serviço só
# executa `node`).
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
           /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

# Chromium e bibliotecas: camada grande e estável (só muda quando o Alpine/Chromium muda).
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
    mesa-gl \
    libx11 \
    libxcomposite \
    libxdamage \
    libxrandr \
    libxkbcommon \
    libxshmfence \
    alsa-lib

# O Chromium (152+, Alpine 3.24) aborta na inicialização se não puder criar o diretório de
# configuração/crash dumps; com a raiz só leitura do compose ele vai para o /tmp (tmpfs).
ENV NODE_ENV=production \
    PORT=3000 \
    TZ=UTC \
    CHROMIUM_PATH=/usr/bin/chromium-browser \
    XDG_CONFIG_HOME=/tmp/.config \
    XDG_CACHE_HOME=/tmp/.cache

# Dependências (camada média) e depois o código (camada pequena). Tudo do root, só leitura para o
# usuário `node`: um processo comprometido não altera o próprio código.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/pdf/node_modules ./apps/pdf/node_modules
COPY --from=pruner /app/out/full/apps/pdf/package.json ./apps/pdf/package.json
COPY --from=pruner /app/out/full/apps/pdf/src ./apps/pdf/src

WORKDIR /app/apps/pdf
USER node
EXPOSE 3000

# O Node 24 executa TypeScript direto (remove os tipos), sem passo de build.
CMD ["node", "--disable-warning=ExperimentalWarning", "src/index.ts"]

# SHA do commit desta imagem (header X-App-Version). Por último e só como ENV, para não invalidar
# camada nenhuma.
ARG GIT_SHA=unknown
ENV APP_VERSION=$GIT_SHA
