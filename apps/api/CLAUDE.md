# backend — CLAUDE.md

API central do sistema Segwise. Único repositório com banco de dados —
tudo que os outros três precisam persistir passa por aqui.

Contexto do sistema inteiro (arquitetura, domínio, convenções comuns): ver
[`../CLAUDE.md`](../CLAUDE.md) e [`../docs/`](../docs/) — leia antes de mexer aqui,
principalmente [`../docs/DOMAIN.md`](../docs/DOMAIN.md) para os nomes de domínio
(`Quote`, `Safe`, `Endorsement`, `Producer`, `Broker`...).

## Stack

Hono (framework HTTP) + Bun (roda TS nativo via `bun --bun run`, sem passo de
transpile separado) + Prisma 7 com `@prisma/adapter-pg` (PostgreSQL) +
better-auth + ioredis (Redis) + Playwright/Chromium (PDF) + pdf-lib/pdf-parse
+ Resend + react-email/handlebars (templates de e-mail) + openai SDK + Biome.

## Comandos

```
bun install
bun run dev              # bun --bun run --watch src/index.ts
bun run start             # bun --bun run src/index.ts

bun run db:generate       # prisma generate
bun run db:migrate:dev    # prisma migrate dev (⚠️ usa o DATABASE_URL do .env = banco REMOTO; ver "Migrations")
bun run db:migrate:reset  # prisma migrate reset  (⚠️ destrutivo — confirmar com o usuário)
bun run db:deploy         # prisma migrate deploy (produção)
bun run db:seed           # prisma db seed

bun run auth:generate     # @better-auth/cli generate --config src/services/auth/index.ts
bun run auth:migrate      # @better-auth/cli migrate --config src/services/auth/index.ts
```

## Migrations (⚠️ leia antes de mexer em `prisma/`)

O `.env` do backend aponta para o banco **remoto/produção**. Nunca rode
`prisma migrate dev|deploy|reset` direto contra ele. Existe um banco de
desenvolvimento **local** (Postgres nativo em `localhost:5432`, sempre disponível) só para
isso; a migration em produção é feita **pelo deploy** (o usuário sobe e o deploy aplica).

Fluxo ao alterar `prisma/schema.prisma`:

```
bun run db:status:local          # estado do banco local (migrations pendentes)
bun run db:migrate:local -- --name nome_da_mudanca   # cria + aplica a migration no banco LOCAL
bun run db:generate              # regenera o client (não toca em banco)
bun run db:local -- <qualquer comando do prisma>     # ex.: migrate deploy, migrate reset, studio
```

- Os scripts `db:*:local` usam `scripts/db-local.ts`, que lê a URL de
  `backend/.env.dev-migrate` (**não versionado**, ignorado pelo git; tem a senha, não copie
  para arquivos versionados) e **recusa rodar se o host não for local**.
- Se o `.env.dev-migrate` não existir, peça ao usuário (formato:
  `DATABASE_URL=postgresql://postgres:<senha>@localhost:5432/postgres`).
- Aviso de perda de dados (ex.: trocar tipo de coluna, drop) ou `migrate reset`, mesmo no
  banco local: pare e confirme com o usuário, e escreva a migration SQL à mão se o dado
  importar em produção (o Prisma propõe drop + recreate).
- Migration só de dados (backfill) vai em `prisma/migrations/<timestamp>_nome/migration.sql`
  e roda igual: no local primeiro, em produção pelo deploy.
- Para testar fluxos de ponta a ponta sem tocar em nenhum banco real, suba Postgres/Redis
  descartáveis em Docker (portas altas, nomes próprios) e apague no fim.

Sem testes automatizados.

## Estrutura (`src/`)

- `routers/`
  - `index.ts` → registra `services/` e `redirects/`.
  - `services/` — um router por domínio: `analytics/` (com `quotes/policies/proposals`),
    `auth/`, `cpf-or-cnpj/`, `endorsements/`, `marketplace/`, `payments/`,
    `pix/`, `producers/`, `quote-financing/`, `quotes/`, `safes/`, `utils/`,
    `vehicles/`, `webhooks/`, `emails.ts`.
  - `redirects/` — redirecionamentos, incluindo deep links para os apps
    mobile (`IOS_APP_URL`/`ANDROID_APP_URL` e as variantes `XCAR`).
  - `api/` — ponto de entrada HTTP.
- `services/` — camada de infraestrutura: `auth/` (adapters), `cache/`
  (Redis), `database/`, `email/`, `pix/`, `server/` (middlewares), `storage/`.
- `libraries/` — `database/` (adapters, serializers), `pdf/`, `s3/`,
  `schemas/` (locais, além do que vem do `core`), `environment.ts`,
  `shutdown.ts`, `get-client-timezone.ts`, `get-next-due-date.ts`.
- `functions/` — `document/`, `fingerprint/`, `hostname/`, `migrations/`,
  `pix/transfeera/`, `response/`, `vehicle/`.
- `templates/` — templates React Email (`partnership-invite/`, e outros —
  há menção a Allianz como seguradora parceira em algum template).
- `prisma/schema.prisma` — modelo de dados completo. Ver
  [`../docs/DOMAIN.md`](../docs/DOMAIN.md) para o significado de cada model.

## Ao adicionar uma rota/feature nova

1. Se envolve um novo formato de dado usado por mais de um repo (o
   `backoffice` ou o `application` vão consumir esse payload), defina o
   schema/tipo no `@segwise/core` primeiro (ver
   [`../core/CLAUDE.md`](../core/CLAUDE.md)) e importe daqui.
2. Siga o padrão de pastas existente: um subdiretório por domínio dentro de
   `routers/services/`, não um arquivo solto.
3. Se a rota mexe em dinheiro (Payment, split Pix, financiamento), a
   integração é com Transfeera — ver `functions/pix/transfeera/` antes de
   reimplementar algo.

## Convites de produtor: `createInvitation` do better-auth exige sessão

`ctx.auth.api.createInvitation` (organization plugin do better-auth) só
funciona com uma sessão de admin autenticado no header (`requireHeaders: true`
+ checagem de membro na própria lib) — é assim que
`routers/services/producers/register.ts` (fluxo do admin) convida um produtor.

Para o **cadastro público** (`routers/services/producers/public-register.ts`,
sem sessão, ver [`../docs/DOMAIN.md`](../docs/DOMAIN.md) e o backlog em
[`../docs/TODO.md`](../docs/TODO.md) para o contexto do pedido), não dá pra
chamar essa API do better-auth — em vez disso a rota cria a linha de
`Invitation` diretamente via Prisma (mesmo formato que o better-auth geraria,
incluindo `inviterId` resolvido a partir do owner/admin da `Broker`) e envia
o e-mail de convite manualmente com o mesmo template (`InvitePartnerEmail`) e
a mesma URL (`functions/hostname/build-accept-invitation-url.ts`, extraído
para ser reaproveitado nos dois lugares). Dali em diante o fluxo já existente
de `utils/accept-invitation.ts` cuida do resto (confirmação de e-mail +
senha) sem saber a diferença entre um convite criado pelo admin ou pelo link
público.

`ctx.auth.api.createUser` (admin plugin), por outro lado, funciona sem sessão
desde que seja chamado **sem** passar `headers` — é assim que tanto o
register.ts do admin quanto o public-register.ts criam o `User` antes do
convite.

`routers/services/producers/public-link.ts` (autenticado, usa
`ctx.session.brokerId`) devolve a URL pronta do link público
(`producer.<domínio>/register/<slug-da-corretora>`) para o admin copiar no
backoffice. A construção da URL do portal do produtor (protocolo, subdomínio,
porta de dev) está em `functions/hostname/build-producer-portal-url.ts`,
reaproveitada também pelo redirect de `utils/accept-invitation.ts` — qualquer
mudança em como o portal do produtor é endereçado deve mexer só nesse helper.

## Geração de PDF: `ctx.browser()` + Handlebars + pdf-lib

Padrão já usado em `routers/services/quotes/[id]/print.ts` e reaproveitado em
`routers/services/safes/print.ts` (impressão em massa da listagem de
propostas, com os mesmos filtros da tabela, ignorando paginação): template
HTML como string compilada com `hbs.compile` (Tailwind via CDN no `<head>`
para estilizar sem precisar de build step), `const { page, release } = await
ctx.browser()` → `page.setContent(html)` → `page.pdf({...})` → `PDFDocument`
(pdf-lib) só para metadata (título/autor) → `Response` com
`Content-Type: application/pdf`. **Não** usar o padrão antigo de
`routers/services/index.ts` (`gerarPdfDaRota`, que navega para uma rota
própria via `page.goto` e mantém um browser Chromium próprio duplicado) — ele
tem um bug de tipo conhecido (`ctx.html(<Element>)` não compila) e não serve
para conteúdo autenticado/escopado por corretora, já que `page.goto` não
carrega a sessão da requisição original. Use sempre `ctx.browser()` (do
`browserMiddleware`, pool gerenciado em `libraries/pdf/browser.ts`) com
`page.setContent`.

Se uma nova rota de listagem precisar de uma versão "imprimir com os mesmos
filtros, sem paginação", replique o padrão de
`routers/services/safes/build-safe-simple-where.ts`: a lógica de `where` do
Prisma fica extraída num módulo à parte, importado tanto pela rota de
listagem paginada quanto pela de impressão — nunca duplicar a lógica de
filtro entre as duas, ou elas divergem silenciosamente com o tempo.

## Integrações externas (ver `.env.example` para a lista completa de envs)

PostgreSQL, Redis, MinIO (S3), Ollama (LLM self-hosted, `OLLAMA_*`/`AI_*`),
Resend (e-mail), APIs brasileiras de terceiros (placas, FIPE, CPF/CNPJ),
Transfeera (Pix/split de pagamento). Nunca commitar segredos — só
`.env.example` (sem valores) fica versionado.

## Docker / deploy

`Dockerfile` multi-stage com Bun + `prisma generate` + Chromium (Playwright),
roda como usuário não-root, tem `entrypoint.sh`. `docker-compose.yml` sobe
`backend` + `cache` (Redis) em rede interna isolada + rede externa
`dokploy-network`. `bun run deploy` só faz push (Dokploy redeploya a partir
do git) — não rodar sem confirmação explícita do usuário, e nunca rodar
`db:migrate:reset` ou `db:deploy` contra produção sem confirmação.

## Busca em listagens

Todo `?search=` usa `parseSearch` (`src/functions/search/parse-search.ts`): CPF/CNPJ/celular por dígitos, e-mail por prefixo, texto com `contains` + `insensitive`, atendido por índice GIN trigram (`pg_trgm`). Nunca o `search` full-text do Prisma (não indexável). Campo novo pesquisável em tabela grande precisa de índice trigram (uma migration por índice, `CREATE INDEX CONCURRENTLY`). Ver `docs/CONVENTIONS.md`.

## Performance e índices

Toda consulta nova/alterada deve ter índice adequado (btree, composto ou GIN para full-text), validado com `EXPLAIN ANALYZE` no banco local, sem travar o banco (`CREATE INDEX CONCURRENTLY` em tabelas grandes) e sem carregar tudo para filtrar no cliente. Regra completa em `docs/CONVENTIONS.md`.
