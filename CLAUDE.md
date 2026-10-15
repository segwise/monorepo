# Segwise — visão geral do sistema

Este é o diretório pai que reúne os 4 repositórios irmãos do sistema Segwise
(corretora/insurtech de seguros automotivos). **Trabalhe sempre a partir daqui**
— abra `segwise.code-workspace` no editor (ou este diretório) em vez de abrir
um repositório isoladamente, para ter contexto dos quatro ao mesmo tempo.

```
segwise/
├── core/         → @segwise/core — lib compartilhada (schemas, tipos, masks, valids, translate)
├── backend/      → API central (Hono + Bun + Prisma/PostgreSQL)
├── backoffice/   → Next.js — admin interno + portal do produtor + portal do cliente
├── application/  → app mobile (Expo/React Native) do segurado final
├── docs/         → documentação global do sistema (ler antes de mexer em qualquer repo)
└── segwise.code-workspace
```

Cada repositório tem seu próprio `CLAUDE.md` com detalhes específicos de stack,
estrutura de pastas e convenções. Este arquivo cobre só o que é comum aos quatro.

## Leia primeiro

1. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — como as peças se conectam, infra, deploy.
2. [`docs/DOMAIN.md`](docs/DOMAIN.md) — glossário do domínio de seguros (Quote, Safe, Endorsement, Producer...).
3. [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — convenções de código comuns aos 4 repos.
4. [`docs/MARKETING.md`](docs/MARKETING.md) — módulo Marketing (campanhas de e-mail, BullMQ, webhook do Resend).
5. [`docs/USERS.md`](docs/USERS.md) — usuários da corretora: perfis, hierarquia e suspensão.
   [`docs/PARTNERS.md`](docs/PARTNERS.md) — cadastro de parceiros: sem CPF/CNPJ, senha criada no painel e acesso imediato (sem e-mail).
   [`docs/ENDORSEMENTS.md`](docs/ENDORSEMENTS.md) — endossos e a reversão (24h, só o mais recente).
6. [`docs/DASHBOARD.md`](docs/DASHBOARD.md) — definições das métricas do dashboard e pendências.
7. [`docs/TODO.md`](docs/TODO.md) — backlog de melhorias identificadas mas ainda não feitas. Confira antes de considerar uma área "explorada do zero".
8. O `CLAUDE.md` do repositório específico que você for editar.

## Regra de ouro do monorepo lógico

`@segwise/core` é o contrato de dados compartilhado entre `backend`, `backoffice`
e `application`. Se uma mudança envolve um tipo, schema Zod, máscara, validador
ou tradução de enum que é usado em mais de um repo, ela **começa no `core`**,
depois é publicada e só então consumida pelos outros. Nunca duplique um schema
que já existe no `core` dentro de `backoffice`/`application`/`backend`.

Fluxo de alteração no core:
```
cd core
# editar src/...
bun run deploy:patch   # ou :minor / :major — builda, sobe versão, publica no GitHub Packages
                        # e já roda `bun update @segwise/core` em backend, backoffice e application
```

## Migrations de banco (regra para IA)

Nunca aplique migration no banco do `.env` do backend (é o remoto/produção). Em
desenvolvimento use sempre o banco local via `bun run db:status:local` /
`db:migrate:local` no `backend/` — detalhes e salvaguardas em
[`backend/CLAUDE.md`](backend/CLAUDE.md#migrations). A produção recebe a migration pelo
deploy, feito pelo usuário.

## Stack comum

- **Runtime/gerenciador de pacotes**: Bun em todos os 4 repos.
- **Linguagem**: TypeScript em todos.
- **Lint/format**: Biome (não ESLint/Prettier) em todos.
- **Validação**: Zod v4 em todos.
- **Datas**: date-fns + date-fns-tz em todos.
- **HTTP client (nos clientes)**: xior, em `backoffice` e `application`.
- **Auth**: better-auth, compartilhado entre `backend` e `backoffice` via cookies.

## O que NÃO existe hoje (atenção ao propor mudanças)

- **Sem testes automatizados** em nenhum dos 4 repos.
- **Sem CI/CD** (não há `.github/workflows`). Deploy é manual: script `deploy`
  em cada `package.json` faz `git add . && git commit && git push`, e a
  plataforma Dokploy (self-hosted) builda a partir do push em `backend` e
  `backoffice`. `application` usa EAS Build + hot-updater (OTA) para builds/updates.
- **Sem README** nos repositórios individuais — este conjunto de `CLAUDE.md`
  e `docs/` é a documentação oficial do projeto a partir de agora.

Se o trabalho envolver adicionar testes, CI ou README, trate como uma decisão
de produto a confirmar com o usuário antes de introduzir a convenção — não
existe um padrão prévio a seguir.
