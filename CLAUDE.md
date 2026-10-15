# Segwise — visão geral do sistema

Monorepo (Bun workspaces + Turborepo) do sistema Segwise (corretora/insurtech
de seguros automotivos). **Trabalhe sempre a partir da raiz** — o contexto dos
apps e dos pacotes compartilhados está todo aqui.

```
segwise/
├── apps/
│   ├── api/          → @segwise/api — API central (Hono + Bun, usa @segwise/database)
│   ├── backoffice/   → @segwise/backoffice — Next.js: admin interno + portal do produtor + portal do cliente
│   └── mobile/       → @segwise/mobile — app mobile (Expo/React Native) do segurado final
├── packages/
│   ├── core/         → @segwise/core — lib compartilhada (schemas, tipos, masks, valids, translate)
│   └── database/     → @segwise/database — schema Prisma, migrations, client gerado, scripts de banco
├── docs/             → documentação global do sistema (ler antes de mexer em qualquer app)
├── turbo.json        → pipeline (generate → build → typecheck/lint)
├── biome.json        → configuração única de lint/format (apps estendem via `"extends": "//"`)
└── package.json      → workspaces, catalogs (versões de React) e scripts da raiz
```

Cada app/pacote tem seu próprio `CLAUDE.md` com detalhes específicos de stack,
estrutura de pastas e convenções. Este arquivo cobre só o que é comum.

## Leia primeiro

1. [`docs/MONOREPO.md`](docs/MONOREPO.md) — como o monorepo funciona: comandos, Turbo, catalogs, Docker, builds nativos.
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — como as peças se conectam, infra, deploy.
3. [`docs/DOMAIN.md`](docs/DOMAIN.md) — glossário do domínio de seguros (Quote, Safe, Endorsement, Producer...).
4. [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — convenções de código comuns.
5. [`docs/MARKETING.md`](docs/MARKETING.md) — módulo Marketing (campanhas de e-mail, BullMQ, webhook do Resend).
6. [`docs/USERS.md`](docs/USERS.md) — usuários da corretora: perfis, hierarquia e suspensão.
   [`docs/PARTNERS.md`](docs/PARTNERS.md) — cadastro de parceiros: sem CPF/CNPJ, senha criada no painel e acesso imediato (sem e-mail).
   [`docs/ENDORSEMENTS.md`](docs/ENDORSEMENTS.md) — endossos e a reversão (24h, só o mais recente).
7. [`docs/DASHBOARD.md`](docs/DASHBOARD.md) — definições das métricas do dashboard e pendências.
8. [`docs/TODO.md`](docs/TODO.md) — backlog de melhorias identificadas mas ainda não feitas. Confira antes de considerar uma área "explorada do zero".
9. O `CLAUDE.md` do app/pacote específico que você for editar.

## Comandos (da raiz)

```
bun install                  # instala tudo (um único bun.lock)
bun run lint                 # turbo run lint (Biome em cada pacote)
bun run typecheck            # turbo run typecheck
bun run build                # turbo run build (core, backoffice)
bun run format               # biome format --write .
bun run db:generate          # gera o client Prisma (@segwise/database)
bun run db:status:local      # estado das migrations no banco LOCAL
bun run db:migrate:local -- --name nome_da_mudanca
bun run db:local -- <comando do prisma>
```

Para rodar um app: `bun run --cwd apps/api dev`, `bun run --cwd apps/backoffice dev`
(precisa de `NEXT_PUBLIC_ROLE_SYSTEM`) ou `bun run --cwd apps/mobile ios|android`.
Para rodar uma tarefa só de um pacote (com as dependências):
`bunx turbo run typecheck --filter=@segwise/api`.

## Regra de ouro do monorepo

`@segwise/core` é o contrato de dados compartilhado entre `api`, `backoffice` e
`mobile`. Se uma mudança envolve um tipo, schema Zod, máscara, validador ou
tradução de enum que é usado em mais de um app, ela **começa no `core`**.
Nunca duplique um schema que já existe no `core` dentro de um app.

Os apps consomem o `core` por `workspace:*` — **não há publicação, versão nem
`bun update`**: a mudança no `core` e nos consumidores entra no mesmo commit.
O `core` precisa estar buildado (`dist/`) para os apps resolverem os subpaths;
o Turbo cuida disso (`^build`).

## Migrations de banco (regra para IA)

Nunca aplique migration no banco do `.env` do `apps/api` (é o remoto/produção).
Em desenvolvimento use sempre o banco local via `bun run db:status:local` /
`db:migrate:local` — detalhes e salvaguardas em
[`apps/api/CLAUDE.md`](apps/api/CLAUDE.md#migrations). A produção recebe a
migration pelo deploy (o `entrypoint.sh` do api roda `prisma migrate deploy`),
feito pelo usuário.

## Stack comum

- **Runtime/gerenciador de pacotes**: Bun em todos (linker isolado — cada pacote
  declara as dependências que importa; nada de depender de hoisting).
- **Monorepo**: Bun workspaces + Turborepo.
- **Linguagem**: TypeScript em todos.
- **Lint/format**: Biome (não ESLint/Prettier), versão única fixada na raiz.
- **Validação**: Zod v4 em todos.
- **Datas**: date-fns + date-fns-tz em todos.
- **HTTP client (nos clientes)**: xior, em `backoffice` e `mobile`.
- **Auth**: better-auth, compartilhado entre `api` e `backoffice` via cookies.
- **React**: versões separadas por plataforma (catalogs `web` e `mobile` no
  `package.json` da raiz) — o mobile segue o Expo, os apps web seguem o Next.

## O que NÃO existe hoje (atenção ao propor mudanças)

- **Sem testes automatizados**.
- **CD e quality gate em implantação**: o CI (lint, typecheck, build, Prisma e Docker)
  existe em `.github/workflows/ci.yml`; faltam o Kodus (quality gate), a branch
  protection e o CD híbrido com Dokploy — ver [`docs/MONOREPO.md`](docs/MONOREPO.md#cicd).
  Enquanto isso, o deploy é manual e feito pelo usuário (o Dokploy builda os
  Dockerfiles do monorepo). Os antigos scripts `deploy` (add/commit/push)
  **foram removidos**.
- **Sem README** — este conjunto de `CLAUDE.md` e `docs/` é a documentação oficial.

Se o trabalho envolver adicionar testes ou README, trate como uma decisão de
produto a confirmar com o usuário antes de introduzir a convenção.
