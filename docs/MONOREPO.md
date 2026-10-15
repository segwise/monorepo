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
- **backoffice**: Next `standalone` com `outputFileTracingRoot` na raiz; o
  servidor é `node apps/backoffice/server.js`.
- **`NEXT_PUBLIC_ROLE_SYSTEM` valores válidos: `admin`, `customer`, `producer`.**
  (`admin` = backoffice interno; `backoffice` **não** é um valor válido — dá 404
  em todas as rotas porque o proxy reescreve para `/${ROLE}/...` e a pasta é
  `src/app/admin`.) O valor é embutido no build (`NEXT_PUBLIC_*`).
- Os `docker-compose.yml` de cada app apontam para a raiz
  (`context: ../..`, `dockerfile: apps/<app>/Dockerfile`).

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

1. **images** — builda e publica no GHCR, em paralelo: `api`, `backoffice-admin`,
   `backoffice-customer`, `backoffice-producer`
   (`ghcr.io/segwise/monorepo/<nome>:sha-<7 chars>` e `:latest`). O backoffice embute
   `NEXT_PUBLIC_ROLE_SYSTEM` (por variante) e `NEXT_PUBLIC_API_URL` (variável do repo) no build.
2. **deploy** — um serviço por vez, **api primeiro** (se falhar, os backoffices não sobem):
   `scripts/dokploy-deploy.sh` chama a API do Dokploy (`application.saveDockerProvider` com a
   imagem da versão e depois `application.deploy`). O Dokploy executa de forma assíncrona, então
   o workflow **não detecta** deploy que falhe depois (ex.: migration quebrada no
   `entrypoint.sh` do api). Fica pendente um health check pós-deploy.
   O job só roda se a variável `DOKPLOY_URL` existir, e cada serviço só é implantado se o seu
   `DOKPLOY_APP_*` existir — dá para migrar um serviço por vez.

**Configuração (uma vez):**

```bash
# variáveis do repositório (não são segredo)
gh variable set NEXT_PUBLIC_API_URL --body 'https://<url-publica-da-api>'
gh variable set DOKPLOY_URL         --body 'https://<seu-dokploy>'
gh variable set DOKPLOY_APP_API       --body '<applicationId da api>'
gh variable set DOKPLOY_APP_ADMIN     --body '<applicationId do backoffice admin>'
gh variable set DOKPLOY_APP_CUSTOMER  --body '<applicationId do customer>'
gh variable set DOKPLOY_APP_PRODUCER  --body '<applicationId do producer>'
# segredo: o gh pede o valor no terminal (não passe o token na linha de comando)
gh secret set DOKPLOY_API_KEY
```

- O token vem de Dokploy → *Profile → API/CLI*; os `applicationId` de `GET <dokploy>/api/project.all`
  (header `x-api-key`).
- **Visibilidade das imagens no GHCR**: pacotes novos nascem **privados**. Como o repo é público,
  torne cada pacote público uma vez (GitHub → *Packages → <pacote> → Package settings → Change
  visibility*) para o Dokploy puxar sem credenciais. Alternativa: manter privado e cadastrar o
  GHCR em *Dokploy → Registry* (`ghcr.io`, usuário e um token clássico com `read:packages`).
- No Dokploy, cada serviço continua sendo uma **Application**; o script troca a fonte para a imagem
  Docker automaticamente. As envs e domínios do serviço ficam como estão. O Redis (cache/queue) do
  api continua separado (fora do CD).
- O deploy usa o *environment* `production` do GitHub; dá para exigir aprovação manual em
  *Settings → Environments → production → Required reviewers* (disponível em repo público).
- **Rollback**: *Actions → CD → Run workflow* com o `sha` anterior.

**Ainda não validado:** a execução real contra o seu Dokploy (corpo exato de
`saveDockerProvider` nessa versão). O primeiro deploy deve ser feito à mão pelo *Run workflow*
e conferido nos logs.

### Ainda a fazer

- **Quality gate**: Kodus **self-hosted no Dokploy** (GitHub App + regras); depois exigir a
  review/check dele no ruleset.
- **CD do mobile**: EAS Build + hot-updater por workflow quando `apps/mobile/**` mudar.
- **Health check pós-deploy** no CD (hoje o workflow não detecta deploy que falhe depois).

## Origem deste repositório

Criado em 2026-10 juntando os 4 repositórios antigos (`core`, `backend`,
`backoffice`, `application`) com `git filter-repo`, preservando o histórico em
`packages/core`, `apps/api`, `apps/backoffice` e `apps/mobile` (o `backend` virou
`api` e o `application` virou `mobile`; o `prisma/` saiu do api para
`packages/database`). Os repositórios antigos devem ser arquivados depois do
primeiro push deste.
