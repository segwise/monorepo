# Monorepo: como funciona

Bun workspaces + Turborepo. Um único `bun.lock`, uma única versão do Biome e do
Turbo, `@segwise/core` e `@segwise/database` como pacotes internos.

## Grafo de dependências

```
apps/api ─────────┬──▶ packages/core
                  └──▶ packages/database ──▶ (Prisma, client gerado)
apps/backoffice ──────▶ packages/core
apps/mobile ──────────▶ packages/core
```

O `mobile` e o `backoffice` **não** dependem do `database` — o client Prisma
nunca entra no bundle deles. Só o `api` fala com o banco.

## Pipeline do Turbo (`turbo.json`)

| Tarefa | O que faz | Depende de |
|---|---|---|
| `generate` | `prisma generate` em `@segwise/database` (saída em `generated/`) | — |
| `build` | `core` (`tsc` + `tsc-alias` → `dist/`), `backoffice` (`next build`) | `^build`, `generate` |
| `typecheck` | `tsc --noEmit` em cada pacote | `^build`, `generate` |
| `lint` | `biome check` em cada pacote | — |
| `dev` | servidores de desenvolvimento (não cacheado) | `^build`, `generate` |

Particularidades:

- O `backoffice` tem `apps/backoffice/turbo.json`: o `typecheck` **espera o
  `build`**, porque os dois escrevem em `.next/types` (rodar em paralelo quebra o
  `tsc` com `TS6053`). O script de typecheck do backoffice roda `next typegen`
  antes do `tsc` (gera `next-env.d.ts` e os tipos globais `PageProps`).
- O `mobile` não tem `build` no Turbo (o build é nativo/EAS). Tem `typecheck` e `lint`.
- `generate` não precisa de `DATABASE_URL`: o script injeta uma URL fictícia só
  para o `prisma.config.ts` carregar. Migrations (`migrate`/`deploy`) continuam
  exigindo a variável real.

## Linker isolado do Bun (regra importante)

O workspace usa o linker **isolado** do Bun (padrão). Cada pacote enxerga só o
que declara no próprio `package.json`. Consequências:

- **Declare toda dependência que você importa.** Não funciona "pegar emprestado"
  pacote que veio transitivo por outro. (Foi preciso declarar explicitamente no
  mobile: `@expo/vector-icons`, `@react-navigation/native-stack`,
  `react-native-css-interop`, `@babel/plugin-transform-react-jsx`,
  `expo-file-system`; e no api: `react`/`react-dom` para os templates de e-mail.)
- Versões diferentes do mesmo pacote convivem sem conflito (ex.: `tailwindcss`
  v3 no mobile por causa do NativeWind, v4 no backoffice).
- **Não ative `linker = "hoisted"`**: quebra o NativeWind (resolve o Tailwind
  errado) e mistura versões de React.
- `expo-doctor` reclama de "duplicate dependencies" (`expo-font`,
  `expo-constants`, `expo-file-system`, `@expo/vector-icons`): é um efeito do
  linker isolado com a dependência circular `expo` ↔ `expo-font`. Foi verificado
  que **não afeta**: o autolinking nativo não vê duplicatas e o bundle JS tem uma
  cópia só. Pode ignorar esse aviso específico.

## React por plataforma (catalogs)

No `package.json` da raiz:

```jsonc
"catalogs": {
  "mobile": { "react": "19.2.0", "react-dom": "19.2.0", "@types/react": "~19.2.14" },
  "web":    { "react": "^19.2.8", "react-dom": "^19.2.8", "@types/react": "^19.2.18", "@types/react-dom": "^19.2.5" }
}
```

Os apps usam `"react": "catalog:web"` (api, backoffice) ou `"catalog:mobile"`.
O React Native exige a versão **exata** do React da sua versão; por isso o
mobile é independente. Para subir o Expo: altere só o catalog `mobile`, rode
`bun install` e valide (`expo-doctor`, `expo export`, build nativo). Os apps web
não são afetados.

## Biome

Config única em `biome.json` na raiz (tab, aspas simples em JS/JSX/CSS, imports
organizados, `noUnusedImports` como warning com fix seguro). Cada pacote tem um
`biome.json` mínimo com `"root": false, "extends": "//"` e só o que difere
(backoffice: domínios `next`/`react`; backoffice e mobile: `noUnknownAtRules`
desligado por causa do Tailwind). A versão do Biome (`2.5.15`) é fixada só na
raiz (`2.5.15`). `bun run lint` (via Turbo) precisa passar sem erros nem warnings.

Cuidados:

- **Rode o lint sempre por pacote** (`bun run lint` ou `cd apps/api && bunx biome check`),
  **não** `biome check .` da raiz: da raiz o Biome não enxerga os aliases `@/` do
  `tsconfig` de cada app e ordena imports de forma diferente (gera falsos erros).
  `bun run format` (só formatação) pode rodar da raiz.
- O backoffice liga `css.parser.tailwindDirectives` (sintaxe do Tailwind v4); o api
  desliga `a11y/noSvgWithoutTitle` para `*.svg` (ativo de e-mail).
- Se `bunx biome --version` dentro de um pacote mostrar versão diferente de 2.5.15,
  sobrou `node_modules/.bin/biome` obsoleto de instalação antiga: apague os
  `node_modules` e rode `bun install` de novo.

## `@segwise/database`

`packages/database` contém `prisma/schema.prisma`, `prisma/migrations/`,
`prisma.config.ts`, `scripts/db-local.ts` e o client gerado em
`generated/prisma/` (**gitignored**, gerado por `generate`). Exports:

```ts
import { PrismaClient } from '@segwise/database/client';
import { SomeEnum } from '@segwise/database/enums';
import type { ... } from '@segwise/database/models';
import { ... } from '@segwise/database/internal/prismaNamespace';
```

Scripts (rodar da raiz ou com `--cwd packages/database`): `generate`,
`migrate:dev`, `migrate:local`, `status:local`, `local`, `migrate:reset`,
`deploy`, `seed`. As regras de segurança de migration estão em
[`apps/api/CLAUDE.md`](../apps/api/CLAUDE.md#migrations) e valem como antes:
nada de `migrate dev|deploy|reset` contra o banco do `.env`.

## Docker

Os Dockerfiles ficam em `apps/api/Dockerfile` e `apps/backoffice/Dockerfile` e
são buildados com **contexto na raiz do monorepo** (há um único `.dockerignore`
na raiz). Cada um usa `turbo prune <pacote> --docker` para copiar só o necessário.

```bash
docker build -f apps/api/Dockerfile -t segwise-api .
docker build -f apps/backoffice/Dockerfile \
  --build-arg NEXT_PUBLIC_ROLE_SYSTEM=admin \
  --build-arg NEXT_PUBLIC_API_URL=https://api.exemplo.com \
  -t segwise-backoffice .
```

- **api**: o `entrypoint.sh` roda `prisma migrate deploy` (pelo
  `packages/database`) e depois `bun run start`. Workdir `/app/apps/api`.
  **Camadas pensadas para o deploy baixar pouco**: o servidor precisa baixar de novo toda camada que
  mudou desde o último deploy. Antes, um único `COPY /app` de 1,4 GB juntava o `node_modules`
  (quase nunca muda) com o código (~10 MB, muda a cada commit), e todo deploy baixava tudo de novo.
  Agora o Dockerfile tem um estágio `prod-deps` (`bun install --production`, sem Biome, turbo,
  TypeScript nem `@react-email/ui`) e copia o `node_modules` numa camada própria (~800 MB, só muda
  quando o lockfile muda), antes do código (~11 MB). Medido localmente: imagem de 2,96 GB → 2,17 GB e,
  trocando uma linha de código, só a camada de código muda (3 de 18 camadas; as de ~800 MB do
  `node_modules` e ~740 MB do Chromium ficam idênticas). Duas regras para não quebrar isso:
  (1) **tudo que o runtime executa precisa ser `dependency`**, não `devDependency` — por isso o
  `prisma` (CLI do `migrate deploy`) e o `dotenv` ficam em `dependencies` do
  `@segwise/database`; (2) o estágio remove o `next` e os binários SWC (~370 MB) que o Bun liga como
  *peer* opcional do `better-auth` — a api nunca importa `next` (se um dia importar
  `better-auth/next-js`, tire essa linha do Dockerfile).
  O compose baixa as imagens **em paralelo** (`Pulling` das 4 juntas): o tempo do pull é o da maior
  imagem, e os backoffices só sobem depois que a api fica saudável (`depends_on`).
- **backoffice**: Next `standalone` com `outputFileTracingRoot` na raiz; o
  servidor é `node apps/backoffice/server.js`.
- **`NEXT_PUBLIC_ROLE_SYSTEM` valores válidos: `admin`, `customer`, `producer`.**
  (`admin` = backoffice interno; `backoffice` **não** é um valor válido — dá 404
  em todas as rotas porque o proxy reescreve para `/${ROLE}/...` e a pasta é
  `src/app/admin`.) O valor é embutido no build (`NEXT_PUBLIC_*`).
- Em produção quem sobe as imagens é o compose único `deploy/docker-compose.yml` (usa as imagens
  publicadas no GHCR, não faz `build`); ver a seção de CD abaixo.

### Hardening das imagens e do runtime

Medido com Trivy (HIGH/CRITICAL com correção disponível): **backoffice 82 vulnerabilidades (8 críticas) → 0;
api 4 → 0**. O que foi feito:

- **Dependências**: `next` 16.0.3 → **16.3.8** (a 16.0.3 tinha uma CRITICAL e ~11 HIGH; o
  `package.json` fixa a versão exata, então só atualiza à mão). `mysql2` e `deepmerge-ts` são
  dependências internas do CLI do Prisma (fixadas por ele) com CVE HIGH: o `overrides` da raiz força as
  versões corrigidas (`migrate deploy` e `validate` testados com elas). **Remova os `overrides` quando
  o Prisma subir de versão e já trouxer as corrigidas.**
- **Imagens base fixadas por digest** (`oven/bun:1.4.2-alpine@sha256:…`, `node:24-alpine@sha256:…`): a
  tag pode mudar sem aviso. O **Dependabot** (`.github/dependabot.yml`) abre PR semanal para atualizar
  os digests e as GitHub Actions. O backoffice saiu do Node 22.14.0 (Alpine 3.21) para o 24.22.0 LTS (Alpine
  3.24); `apk upgrade` no build traz os patches do SO (OpenSSL).
- **Sem npm/yarn/corepack no runtime do backoffice**: o servidor só executa `node`, e o npm embutido
  trazia pacotes vulneráveis (`tar`) e superfície de ataque sem uso. O `bun` do build é copiado da imagem
  oficial (sem `npm install -g`).
- **Nada roda como root e o código é só leitura**: api como `appuser` (uid/gid fixos 10001), backoffice
  como `node` (1000), Redis como `redis` (999). Código e `node_modules` pertencem ao root, então um
  processo comprometido não altera o próprio código nem as bibliotecas.
- **Compose (`x-hardening`)**: `cap_drop: ALL`, `no-new-privileges` e `read_only: true` em todos os
  serviços; só `/tmp`, o cache do Chromium (`/home/appuser/.cache`, api) e o cache do Next
  (`.next/cache`) são `tmpfs` graváveis. **Regra para quem for mexer**: se o app passar a gravar em disco,
  declare um `tmpfs` ou volume no compose para esse caminho (senão falha com `Read-only file system`).
- **Testado com as restrições ligadas** (compose local, Postgres e Redis externos): os 5 serviços
  saudáveis, 63 migrations, rotas com `X-App-Version`, geração de PDF no Chromium, o otimizador de
  imagens do Next (`sharp`) com escrita de cache, persistência (AOF) do Redis após reiniciar e **0**
  erros de permissão (`EACCES`/`EROFS`) nos logs. Esse teste pegou um problema: o entrypoint oficial do
  Redis precisa de `SETPCAP`/`SETUID`/`SETGID` para trocar de usuário, por isso o serviço roda direto
  como `user: 999:999` (o volume `cache-data` já pertence a esse usuário).
- **Varredura semanal** (`.github/workflows/security.yml`, Trivy): escaneia as 4 imagens publicadas no GHCR
  e falha se surgir HIGH/CRITICAL com correção, porque novas CVEs aparecem depois da build. Também roda
  sob demanda (*Actions → Security → Run workflow*).

**Node 24 LTS no backoffice** (`node:24-alpine`, Node 24.22.0; o Next exige só `>=20.9`). **Atenção ao
build local**: o `next build` sob Node 24 usa bem mais memória que sob Node 22 — numa VM do Docker de
3,8 GB passou em 2 de 7 tentativas (no Node 22 passou sempre) e, pior, o *OOM killer* da VM derrubou outros
containers. No CI (16 GB) não é problema e o servidor só puxa a imagem pronta; para buildar a imagem
localmente, dê **pelo menos 6 GB** ao Docker. Um teto de heap (`--max-old-space-size`) não ajudou nos
testes e arrisca quebrar o build no CI, por isso não foi adotado.

**`/dev/shm` e `tmpfs`**: a api tem `shm_size: 256m` (o padrão do Docker é 64 MB e o Chromium usa
`/dev/shm` entre processos; o pool tem até 6 contextos). **Precaução, não correção comprovada**: tentei
reproduzir queda com uma página pesada (40 canvases de 2400²) e o Chromium aguentou nos 64 MB; o teste com 6
páginas em paralelo era pesado demais para a VM e foi interrompido. Os `tmpfs` agora têm teto de tamanho
(`/tmp` 256 MB na api e 64 MB no web, `~/.cache` 128 MB, `.next/cache` 256 MB): sem `size`, um `tmpfs` pode
chegar a metade da RAM do servidor.

**Sandbox do Chromium (api) — tentado e NÃO habilitado.** O Playwright já passa `--no-sandbox` por padrão
(`chromiumSandbox: false`) e o código também. Com o `seccomp` padrão do Docker e `cap_drop: ALL` o sandbox
nem inicia (`Failed to move to new namespace: Operation not permitted`). Um perfil mínimo (padrão do Docker
+ `clone`/`unshare`/`setns`) destravou a criação do namespace, mas o Chromium parou em
`sys_chroot("/proc/self/fdinfo/")` (ENOENT) na Docker Desktop — depende do kernel, do `/proc` e do AppArmor
do host, e o servidor de produção não foi testado. O perfil oficial do Playwright liberaria também
`io_uring` e `socket` sem filtro. Como ligar o sandbox exigiria um perfil `seccomp` próprio (mais
superfície no kernel para o container inteiro), com fallback e teste no servidor real, e o risco prático é
baixo, a decisão foi **manter `--no-sandbox`** com as camadas de contenção já feitas. Evidências do risco: o
Chromium só renderiza HTML montado pela própria api (`page.setContent` nas 3 rotas de impressão: propostas,
cotações e contatos), nunca navega para URLs de terceiros; os templates usam Handlebars `{{ }}` (escapa HTML)
sem `{{{ }}}`/`SafeString`/`noEscape`; o container roda sem root, sem capabilities, com raiz só leitura e
`no-new-privileges`. Para retomar: testar no servidor do Dokploy (`uname -r`, AppArmor
`kernel.apparmor_restrict_unprivileged_userns`) um `docker run` com `chromiumSandbox: true` e um perfil
mínimo, e só então ligar no compose com fallback para `--no-sandbox` registrado em log.

O **primeiro deploy** depois destas mudanças baixa as camadas novas (bases e Chromium); os seguintes voltam a
ser incrementais.

## Mobile (Expo)

- Bundle JS: `bunx expo export --platform ios|android` (em `apps/mobile`) —
  validado nos dois.
- Build nativo: `expo prebuild` gera `ios/` e `android/` (gitignored, grandes —
  1 GB e 3,5 GB; apague quando não precisar). Android: `./gradlew assembleDebug`
  (JDK 17 + Android SDK). iOS: `pod install` + `xcodebuild`.
- **Xcode 27**: pods de terceiros com deployment target antigo (SDWebImage 9.0,
  RNSVG 12.4) falham no build; passa com `IPHONEOS_DEPLOYMENT_TARGET=16.0` na
  linha de comando. Tratar antes de depender do EAS Build com Xcode novo.
- `expo-doctor` hoje aponta `react-native 0.83.4` vs `0.83.10` e
  `react-native-worklets 0.7.2` vs `0.7.4` (já era assim antes da migração).
- Uploads multipart usam `File` do `expo-file-system` + `fetch` de `expo/fetch`
  (não mais objetos `{ uri, name, type }`); **ainda falta testar em dispositivo
  real** (nome e `Content-Type` do arquivo no servidor).
- EAS Build e hot-updater **não foram validados** no monorepo. O `eas.json`
  fixa `bun 1.3.10` (a raiz usa 1.4.2). Rodar EAS a partir de `apps/mobile`.

## Segurança

Os `.npmrc` dos repos antigos tinham um token do GitHub Packages versionado. O
token foi **revogado**, e o histórico deste monorepo foi reescrito sem
`.npmrc`/`.env`/`.env.dev-migrate`. Como o `core` agora é `workspace:*`, não há
mais `.npmrc` nem registry privado. `.env*` está no `.gitignore` (só
`.env.example` é versionado).

## CI/CD

Repositório: `github.com/segwise/monorepo`.

### CI (implementado em `.github/workflows/ci.yml`)

Roda em PR e em push na `main`. Jobs:

- **verify** — `bun install --frozen-lockfile` + `turbo run lint typecheck build`. Em PR usa
  `--affected` (base `origin/<base_ref>`); em push na main roda tudo. Cache do Bun e do
  Turbo (`.turbo`) via `actions/cache` (sem remote cache por enquanto).
- **database** — `prisma validate` + `prisma migrate deploy` do zero num Postgres de serviço
  (pega SQL quebrado, ordem errada e `CONCURRENTLY` junto de outros comandos). Não usa
  `migrate diff`: os índices GIN trigram existem só nas migrations e dariam falso positivo.
- **docker** — build (sem publicar) das imagens `api` e `backoffice`, só quando algo relevante
  muda em PR (`dorny/paths-filter`); sempre na main.
- **ci** — agregador; é o **único check obrigatório** a configurar na branch protection.

O workflow foi validado com `actionlint` e as mesmas tarefas rodaram em clone limpo; a
**primeira execução real no GitHub ainda não aconteceu**.

### Branch protection

O repositório é **público** (decisão de 2026-10: a org está no plano GitHub Free, que só
aplica branch protection/rulesets em repos públicos — em privado o GitHub avisa *"rulesets
won't be enforced ... until you upgrade to GitHub Team"*). O ruleset `protect-main` está
**ativo** na `main`: exige PR, exige o check `CI` (do app `github-actions`) verde, bloqueia
force-push e exclusão da branch, sem lista de bypass. Aprovações de review: 0 (equipe de uma
pessoa; aumentar quando houver mais gente).

Consequências de ser público: o código e o histórico são visíveis a qualquer pessoa; Actions
em runners do GitHub são gratuitos; **nunca** commitar segredos (use GitHub Secrets). Se o repo
voltar a ser privado, o ruleset deixa de ser aplicado até o upgrade para GitHub Team.

### CD (`.github/workflows/cd.yml`) — implementado, falta configurar o Dokploy

Dispara quando o **CI termina com sucesso na `main`** (`workflow_run`) ou à mão
(`workflow_dispatch`, com `sha` opcional para rollback e `deploy` para só publicar imagens).

1. **images** — builda e publica no GHCR, em paralelo, quatro imagens (a imagem do `backoffice`
   é a variante `admin`; `customer` e `producer` são as outras duas variantes do mesmo app):
   `ghcr.io/segwise/api`, `ghcr.io/segwise/backoffice`, `ghcr.io/segwise/customer` e
   `ghcr.io/segwise/producer`, cada uma com as tags `sha-<7 chars>` e `latest`. As imagens do
   Next embutem `NEXT_PUBLIC_ROLE_SYSTEM` (por variante) e `NEXT_PUBLIC_API_URL` (variável do repo)
   no build. As imagens são **`linux/amd64`** (runner do GitHub): o servidor do Dokploy precisa
   ser x86_64. Os pacotes publicados a partir deste repo público ficam **públicos** (verificado
   com `docker manifest inspect` sem login), então o Dokploy puxa sem credenciais.
2. **deploy** — `scripts/dokploy-deploy.sh` chama `compose.deploy` na API do Dokploy (que só
   responde "Deployment queued") e então **espera o resultado**: consulta `compose.one` até
   aparecer uma execução nova e ela terminar; se terminar em `error`, o job **falha** (veja o log
   do deployment no painel do Dokploy). Depois faz um **teste de fumaça** nas URLs da variável de
   repositório `HEALTHCHECK_URLS` (separadas por espaço), com até 4 min por URL, porque `up -d`
   devolve antes de os healthchecks do compose terminarem. Cada entrada leva um sufixo
   `#<status>` com o HTTP **exato** esperado (`https://…/sign-in#200`; o fragmento não vai ao
   servidor) — sem sufixo vale qualquer resposta < 500, o que deixa passar um 404 em rota errada.
   **Versão no ar**: a api e o backoffice devolvem o header `X-App-Version` com o SHA do commit
   da imagem (build-arg `GIT_SHA` → `APP_VERSION`; middleware `version.ts` na api,
   `headers()` no `next.config.ts`), em toda resposta (200, 404, redirects). O CD passa o SHA
   publicado em `EXPECTED_VERSION` e cada URL só passa quando devolve **esse** SHA: um serviço
   antigo, outro serviço ou um proxy sem o header no domínio reprovam o deploy. Sem
   `HEALTHCHECK_URLS` só espera o Dokploy; sem `EXPECTED_VERSION` só confere o status.
   **Segurança**: a resposta de `compose.one` inclui o `env` do compose (todos os segredos) e o log
   das Actions é público — o script nunca a imprime, só extrai id e status com `jq`. Se os nomes de
   campo da sua versão do Dokploy forem outros, o timeout imprime os **nomes** dos campos (nunca os
   valores) para ajustar o `jq`.
   Os três valores (`DOKPLOY_URL`, `DOKPLOY_COMPOSE_ID`, `DOKPLOY_API_KEY`) são **segredos** do
   GitHub, não variáveis: o repo é público e os logs das Actions também, então só um segredo é
   mascarado (`***`) — uma variável exporia o endereço do painel do Dokploy. Como o contexto
   `secrets` não existe no `if` do job, o primeiro passo confere a configuração: nenhum segredo
   definido = só avisa (Dokploy ainda não configurado); configuração **parcial** = falha.

#### Stack de produção: um compose só (`deploy/docker-compose.yml`)

Um compose com `api`, `backoffice`, `customer`, `producer` e o Redis de `cache` (em rede interna
sem acesso externo). Ficam **fora do compose**, como *Databases* do Dokploy, o **Postgres** e o
**Redis da fila do BullMQ**: o ciclo de vida e o backup deles não devem acompanhar o deploy da
aplicação (um `compose down -v` ou uma recriação nunca toca nos dados).

- **Postgres**: Database Postgres do Dokploy + *Backups* agendados para um destino S3
  (*Settings → Destinations*). É o caso documentado de backup dedicado de banco.
- **Redis da fila**: Database Redis **gerenciado** do Dokploy, com *comando personalizado*
  (*Advanced → Run Command*) `--appendonly yes --maxmemory-policy noeviction` (exigência do
  BullMQ). `QUEUE_URL` usa o host interno e a senha que o Dokploy mostra. **Backup**: *Volume
  Backup* do volume de dados do Redis para o S3, agendado fora do horário de pico. A documentação do
  Dokploy avisa que copiar um volume com o serviço escrevendo pode gerar inconsistência e
  recomenda a opção *Turn off Container* (a fila fica fora do ar durante o backup; o BullMQ do
  api reconecta sozinho). Mesmo assim, a api **reconcilia os schedulers das campanhas a cada boot**
  (`docs/MARKETING.md`), então perder ou restaurar o Redis da fila não deixa campanha sem envio
  nem ressuscita campanha apagada.
- **Cache** (no compose): volume nomeado `cache-data` com AOF, porque guarda consultas pagas de
  CPF/CNPJ sem TTL. Por ser volume nomeado de um compose, aceita *Volume Backup* do Dokploy
  (a doc recomenda desligar o container durante o backup para evitar inconsistência).
- **Pub/Sub**: não há uso hoje, então não foi adicionado. Quando precisar: um serviço novo no
  compose, ou reaproveitar o `cache` (pub/sub não guarda chaves, então a política de eviction
  não interfere).

- **Versão atômica**: api e os 3 backoffices sobem juntos, na mesma versão do contrato
  (`@segwise/core`).
- As imagens são `:latest` com `pull_policy: always`: cada `docker compose up -d` baixa a
  versão nova e **recria só os serviços cuja imagem mudou** (os Redis não são recriados e
  mantêm os dados — verificado). **Rollback**: *Actions → CD → Run workflow* com o `sha`
  desejado (rebuilda do cache e republica `latest`).
- Healthchecks: api (qualquer resposta HTTP; `start_period` de 90 s cobre as migrations), backoffices
  (`/sign-in`) e Redis; os backoffices esperam a api ficar saudável (`depends_on`).
- As variáveis da aba *Environment* do Dokploy vão para um `.env` e **não chegam sozinhas aos
  containers**: o compose referencia cada `${VAR}`. A lista está em `deploy/.env.example`, e o CI
  falha se o compose usar uma variável que não esteja documentada lá. Opcionais numéricas
  (`AI_REQUEST_TIMEOUT_MS`, `AI_MAX_TEXT_CHARS`, `AI_MAX_COMPLETION_TOKENS`) têm default igual ao
  do código (vazio viraria `0`); `CUSTOMER_PORTAL_URL` cai para `APPLICATION_URL`.
- Testado localmente (com Postgres e Redis externos descartáveis, como serão os Databases do
  Dokploy): os 5 serviços ficam saudáveis, as 63 migrations são aplicadas pelo entrypoint, a api
  cria as chaves `bull:marketing:*` no Redis externo da fila, os backoffices sobem só depois
  da api e o backoffice **não** resolve o nome do Redis de cache (rede interna isolada). O CI
  valida o arquivo (`docker compose config`).
- Limitação: o deploy é `docker compose up`, não Swarm — um serviço que muda é recriado, com
  alguns segundos fora do ar (a documentação do Dokploy não descreve zero downtime para
  compose; não foi medido). Reverter um serviço isolado deixa de ser possível (reverte-se a stack).

**Configuração (uma vez):**

1. **No Dokploy**: antes do compose, criar os dois *Databases* (Postgres com *Backup* para S3, e
   Redis da fila com AOF + `noeviction`) e anotar o host interno e a senha de cada um para
   `DATABASE_URL` e `QUEUE_URL`. Depois criar um serviço *Docker Compose* (no projeto da Segwise) com fonte **Git**
   (`https://github.com/segwise/monorepo`, branch `main`, caminho `./deploy/docker-compose.yml`),
   **Auto Deploy desligado** (quem dispara é o CD) e **Isolated Deployment desligado** (não foi
   testado com o roteamento). Preencher a aba *Environment* com as variáveis de
   `deploy/.env.example`. Em *Domains*, um domínio por serviço, porta `3000`: `api`,
   `backoffice`, `customer`, `producer`.
2. **No GitHub**:

```bash
# os três são segredos (repo público: mascarados nos logs). Sem --body o gh pede o valor no
# terminal — prefira assim para o token, para ele não ficar no histórico do shell.
gh secret set DOKPLOY_API_KEY                                 # token: Dokploy → Profile → API/CLI
gh secret set DOKPLOY_URL        --body 'https://<seu-dokploy>'
gh secret set DOKPLOY_COMPOSE_ID --body '<composeId>'         # GET <dokploy>/api/project.all
```

   (`NEXT_PUBLIC_API_URL` já está definida.) O deploy usa o *environment* `production` do
   GitHub; dá para exigir aprovação manual em *Settings → Environments → production → Required
   reviewers*.
3. **Corte dos Applications atuais**: subir o compose com domínios temporários, testar
   (login, fila, upload) e só então trocar os domínios; manter os Applications antigos
   parados por alguns dias como plano de volta. O cache do compose começa vazio (as
   consultas pagas de CPF/CNPJ serão cobradas de novo, a menos que se migre o volume). O Redis da
   fila é um Database novo: os jobs pendentes no antigo precisam terminar antes do corte, e os
   schedulers das campanhas ativas são recriados sozinhos pela reconciliação do boot da api.
   O primeiro deploy deve ser feito à mão (*Run workflow*) e conferido nos logs.

**Validado no Dokploy real**: `compose.deploy` (responde `Deployment queued`, com URL, composeId e token
mascarados no log público) e o acompanhamento do status via `compose.one` (campos `deploymentId` e
`status`: `running` → `done`). Os caminhos de erro (deploy em `error`, sem deployment novo, falha
pontual da API, URL com 503, token inválido, versão antiga ou ausente, status errado) foram testados
contra um Dokploy falso, sem vazamento de segredo.

**Rotas da api em produção**: a api só responde sob `/services/…` (`basePath('/services')`); em desenvolvimento um `getPath` acrescenta esse prefixo a partir do subdomínio. Com a imagem em modo `production`, `/services/marketplace` dá 200 e `/marketplace` dá 404. No domínio público observou-se o contrário (`/marketplace` → 200, `/services/marketplace` → 404), o que indica que o proxy acrescenta o prefixo (*Internal Path* `/services` do domínio no Dokploy) — a rota pública certa é `/marketplace`. Em outra sondagem, com o domínio respondendo diferente, o mesmo caminho deu 404 e depois 200: um teste de fumaça `< 500` aceita as duas respostas e, enquanto havia um backend antigo no domínio, um `200` não provava nada sobre o compose novo. Daí o status exato (`#200`) e o header de versão.

**`HEALTHCHECK_URLS`** (variável do repo): a **raiz** de cada domínio —
`https://services.segwise.com.br/`, `https://backoffice.segwise.com.br/`,
`https://customer.segwise.com.br/` e `https://producer.segwise.com.br/`. Como o `X-App-Version` sai em
toda resposta (inclusive o redirect 307 dos backoffices para `/sign-in` e o 301/404 da api), não
precisa de rota específica: o que prova o deploy é a **versão**, e o status só precisa ser < 500.
O sufixo `#<status>` continua disponível para exigir um HTTP exato. Trade-off: a raiz não exercita o
banco (a rota `/marketplace` exercitava); a conexão com o Postgres é garantida no boot pelo
`migrate deploy` do entrypoint.

**Limites do teste de fumaça**: o `up -d` devolve antes dos healthchecks do compose terminarem —
por isso as URLs ganham até 4 min — e o `cache` não tem URL pública. Dica (não verificada): em
*Advanced → Command* do compose dá para usar `up -d --remove-orphans --wait`, que faz o próprio
deploy do Dokploy falhar se algum container ficar *unhealthy*.

### Ainda a fazer

- **Quality gate**: Kodus **self-hosted no Dokploy** (GitHub App + regras); depois exigir a
  review/check dele no ruleset.
- **CD do mobile**: EAS Build + hot-updater por workflow quando `apps/mobile/**` mudar.

## Origem deste repositório

Criado em 2026-10 juntando os 4 repositórios antigos (`core`, `backend`,
`backoffice`, `application`) com `git filter-repo`, preservando o histórico em
`packages/core`, `apps/api`, `apps/backoffice` e `apps/mobile` (o `backend` virou
`api` e o `application` virou `mobile`; o `prisma/` saiu do api para
`packages/database`). Os repositórios antigos devem ser arquivados depois do
primeiro push deste.
