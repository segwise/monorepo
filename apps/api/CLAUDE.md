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
bun run db:migrate:dev    # prisma migrate dev
bun run db:migrate:reset  # prisma migrate reset  (⚠️ destrutivo — confirmar com o usuário)
bun run db:deploy         # prisma migrate deploy (produção)
bun run db:seed           # prisma db seed

bun run auth:generate     # @better-auth/cli generate --config src/services/auth/index.ts
bun run auth:migrate      # @better-auth/cli migrate --config src/services/auth/index.ts
```

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
