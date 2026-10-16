# Contexto de build: raiz do monorepo
#   docker build -f apps/pdf/Dockerfile .
#
# Serviço HTML -> PDF, isolado da api. Navegador: o Chrome Headless Shell que o próprio Playwright
# baixa para a versão do `playwright-core` do lockfile (combinação suportada; o Chromium do Alpine
# vinha com outra versão e arrastava LLVM, mesa, ffmpeg e GTK: ~800 MB descomprimidos). Base Debian
# slim porque o headless shell é glibc.
#
# Runtime: Bun (como a api, o backoffice e o migrate; o Bun 1.4 suporta o Playwright). O headless shell
# é glibc, então a base é Debian e o binário é o do Bun glibc (imagem oven/bun Debian), não o do Alpine.
#
# Camadas da mais estável para a mais volátil: bibliotecas do sistema -> Bun -> navegador ->
# dependências -> código. O servidor baixa o navegador uma vez; deploys seguintes só o código.
#
# Imagens base FIXADAS POR DIGEST (cadeia de suprimentos). O Dependabot abre PR para atualizar; à mão:
#   docker pull debian:trixie-slim && docker image inspect debian:trixie-slim --format '{{index .RepoDigests 0}}'
FROM oven/bun:1.4.3-alpine@sha256:629e17411f1f129dbec3af78d5af9c9f2a937435c80349437206c6b0b7422373 AS bun
FROM oven/bun:1.4.3-slim@sha256:14a223fa35747ec728bce300ef85888bc5f7958164d15bbba6a54b22b52a3288 AS bun-glibc
FROM debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f AS debian

FROM bun AS pruner
WORKDIR /app
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune @segwise/pdf --docker

# Só dependências de produção (playwright-core e zod, JavaScript puro: instalar no Alpine serve).
FROM bun AS prod-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile --production

# Baixa o headless shell da versão exata que este playwright-core espera (CDN oficial do Playwright,
# HTTPS). Fica só o necessário: sem ffmpeg (gravação de vídeo) e só os idiomas en-US e pt-BR da
# interface do navegador (os outros 218 somam ~48 MB e um PDF não usa nenhum).
FROM bun-glibc AS browser
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/pdf/node_modules ./apps/pdf/node_modules
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN bun apps/pdf/node_modules/playwright-core/cli.js install chromium-headless-shell \
 && rm -rf /ms-playwright/ffmpeg-* \
 && find /ms-playwright -path '*/locales/*.pak' ! -name 'en-US.pak' ! -name 'pt-BR.pak' -delete

# O Chrome só carrega a libgbm (está ligada ao binário); com a GPU desligada ele nunca cria um
# dispositivo, então o driver (mesa-libgallium, que arrasta o LLVM: ~120 MB) não é usado. Por isso a
# biblioteca é extraída do pacote sozinha, sem as dependências. O smoke do CI prova que o Chrome sobe.
FROM debian AS gbm
RUN apt-get update \
 && cd /tmp && apt-get download libgbm1 \
 && dpkg-deb -x libgbm1_*.deb /gbm \
 && mkdir /out && cp -a /gbm/usr/lib/*/libgbm.so.1* /out/

FROM debian AS runner

# Bibliotecas que o binário do headless shell exige (lista do próprio ELF, não a do Chrome completo:
# sem GTK, CUPS, curl, ffmpeg) + fontconfig e as fontes. `apt-get upgrade` traz os patches de
# segurança publicados depois da imagem base. Tudo numa camada, sem listas do apt nem documentação.
RUN apt-get update \
 && apt-get upgrade -y \
 && apt-get install -y --no-install-recommends \
    libglib2.0-0t64 \
    libnss3 \
    libnspr4 \
    libatk1.0-0t64 \
    libatk-bridge2.0-0t64 \
    libatspi2.0-0t64 \
    libdbus-1-3 \
    libx11-6 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxkbcommon0 \
    libexpat1 \
    libudev1 \
    libasound2t64 \
    libdrm2 \
    libwayland-server0 \
    fontconfig \
    fonts-freefont-ttf \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* /var/cache/apt/* /var/log/* \
           /usr/share/doc/* /usr/share/man/* /usr/share/info/* /usr/share/locale/*

COPY --from=gbm /out/ /usr/lib/x86_64-linux-gnu/

# Só o binário do Bun (glibc): o serviço executa `bun`.
COPY --from=bun-glibc /usr/local/bin/bun /usr/local/bin/bun

RUN groupadd -g 1000 pdf && useradd -u 1000 -g pdf -M -d /tmp -s /usr/sbin/nologin pdf

COPY --from=browser /ms-playwright /ms-playwright

# O headless shell grava configuração/crash dumps no diretório do usuário; com a raiz só leitura do
# compose isso vai para o /tmp (tmpfs).
ENV NODE_ENV=production \
    PORT=3000 \
    TZ=UTC \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    HOME=/tmp \
    XDG_CONFIG_HOME=/tmp/.config \
    XDG_CACHE_HOME=/tmp/.cache

WORKDIR /app

# Dependências (pequenas) e depois o código. Tudo do root, só leitura para o usuário `pdf`.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/pdf/node_modules ./apps/pdf/node_modules
COPY --from=pruner /app/out/full/apps/pdf/package.json ./apps/pdf/package.json
COPY --from=pruner /app/out/full/apps/pdf/src ./apps/pdf/src

WORKDIR /app/apps/pdf
USER pdf
EXPOSE 3000

# O Bun executa TypeScript direto, sem passo de build.
CMD ["bun", "src/index.ts"]

# SHA do commit desta imagem (header X-App-Version). Por último e só como ENV, para não invalidar
# camada nenhuma.
ARG GIT_SHA=unknown
ENV APP_VERSION=$GIT_SHA
