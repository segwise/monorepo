# Contexto de build: raiz do monorepo
#   docker build -f apps/api/Dockerfile .
#
# Camadas pensadas para o deploy baixar pouco: o node_modules (grande, só muda quando o lockfile
# muda) fica numa camada própria, ANTES do código (pequeno, muda a cada commit). Só dependências
# de produção, enxugadas e verificadas, vão para a imagem (ver o estágio prod-deps); sem navegador.
#
# Imagem base FIXADA POR DIGEST (cadeia de suprimentos: a tag pode mudar sem aviso). O Dependabot
# (.github/dependabot.yml) abre PR para atualizar o digest; para subir à mão:
#   docker pull oven/bun:1.4.3-alpine && docker image inspect oven/bun:1.4.3-alpine --format '{{index .RepoDigests 0}}'
FROM oven/bun:1.4.3-alpine@sha256:629e17411f1f129dbec3af78d5af9c9f2a937435c80349437206c6b0b7422373 AS base

FROM base AS pruner
WORKDIR /app
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune @segwise/api --docker

# Só dependências de produção, enxugadas:
#  - scripts/prune-node-modules.ts: apaga os pacotes que o código não alcança (CLI do Prisma, que só
#    as migrations usam e vive na imagem `migrate`; CLI do react-email; `next`/`sharp` do peer opcional
#    do better-auth; TypeScript...). Detalhes e lista no próprio script;
#  - do client do Prisma fica só o compilador de queries do PostgreSQL (o único que o client gerado
#    importa; os de MySQL, SQLite, SQL Server e CockroachDB somavam ~60 MB);
#  - binários nativos para glibc: a imagem é Alpine (musl) e só carrega as variantes `-musl`;
#  - tipos (.d.ts), source maps e markdown: nada disso é lido em runtime;
#  - builds `*.development.js` (React e afins escolhem o build de produção pelo NODE_ENV=production
#    desta imagem), o código-fonte TypeScript do SDK da OpenAI (`openai/src`, só para source maps) e os
#    builds do pdfjs que o pdf-parse não usa (ele carrega só `pdfjs-dist/legacy`; `build/` e o viewer
#    `web/` sobram). O smoke-api extrai texto e renderiza uma página com o pdf-parse dentro da imagem.
# O estágio `verify` abaixo prova que o código ainda resolve todos os imports.
FROM base AS prod-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/full/apps/api/scripts/prune-node-modules.ts /tmp/prune-node-modules.ts
RUN bun install --frozen-lockfile --production \
 && bun /tmp/prune-node-modules.ts /app \
 && find node_modules/.bun -path '*/@prisma/client/runtime/query_compiler_*' \
      ! -name 'query_compiler_fast_bg.postgresql.*' -delete \
 && rm -rf node_modules/.bun/*-linux-*-gnu@* \
 && find node_modules/.bun -type f \( -name '*.d.ts' -o -name '*.d.mts' -o -name '*.d.cts' \
      -o -name '*.map' -o -name '*.md' -o -name '*.markdown' -o -name '*.development.js' \) -delete \
 && rm -rf node_modules/.bun/openai@*/node_modules/openai/src \
           node_modules/.bun/pdfjs-dist@*/node_modules/pdfjs-dist/build \
           node_modules/.bun/pdfjs-dist@*/node_modules/pdfjs-dist/web

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

# Empacota a api (`bun build`, descartado) contra o node_modules ENXUTO: se o prune tirou algo que o
# código importa, o build da imagem falha aqui em vez de a api quebrar em produção. Os binários
# nativos do canvas são externos (cada plataforma tem o seu; só o `-musl` existe aqui).
FROM base AS verify
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=prod-deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder /artifact/ ./
# NODE_ENV=production como em runtime: os `require` dos builds de desenvolvimento ficam em ramos mortos.
RUN cd apps/api && bun build src/index.ts --target=bun --outdir=/tmp/verify --external '@napi-rs/canvas-*' \
      --define 'process.env.NODE_ENV="production"' --minify-syntax \
 && rm -rf /tmp/verify

FROM base AS runner
WORKDIR /app

# Patches de segurança do Alpine publicados depois da imagem base (ex.: OpenSSL), em camada própria
# e pequena. O Chromium (PDF) não vive mais aqui: é o serviço apps/pdf, em outra imagem e rede.
RUN apk upgrade --no-cache

RUN addgroup -S -g 10001 appgroup && adduser -S -u 10001 -G appgroup appuser

# O código e as dependências pertencem ao root e são só leitura para o usuário da aplicação: um
# processo comprometido não consegue alterar o próprio código nem as bibliotecas.
# 1) dependências (camada grande e estável) e os links de cada workspace (pequenos). Vêm do estágio
#    `verify`: a imagem só fica pronta se a verificação dos imports passou.
COPY --from=verify /app/node_modules ./node_modules
COPY --from=verify /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=verify /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=verify /app/packages/database/node_modules ./packages/database/node_modules

# 2) código + build do core + client Prisma gerado (camada pequena, muda a cada commit)
COPY --from=builder /artifact/ ./

# Diretório gravável do usuário (no compose o resto do sistema de arquivos é só leitura).
RUN mkdir -p /home/appuser/.cache && chown -R appuser:appgroup /home/appuser

WORKDIR /app/apps/api

USER appuser

ENV NODE_ENV=production
ENV TZ=UTC
ENV PORT=3000

EXPOSE 3000

# As migrations NÃO rodam aqui: são o serviço `migrate` do compose (packages/database/Dockerfile), que
# termina antes de a api subir. Sem `bun run` intermediário: o Bun é o PID 1 e recebe o SIGTERM.
CMD ["bun", "--bun", "src/index.ts"]

# SHA do commit desta imagem: sai no header X-App-Version (ver middlewares/version.ts). Por último
# (e só como ENV, sem RUN depois) para não invalidar nenhuma camada anterior.
ARG GIT_SHA=unknown
ENV APP_VERSION=$GIT_SHA
