# backoffice — CLAUDE.md

Painel web Next.js. **Uma base de código, três deployments** controlados por
`NEXT_PUBLIC_ROLE_SYSTEM` (`admin` | `customer` | `producer`) — veja
`deploy/docker-compose.yml` na raiz. Antes de mudar algo "global" (layout, providers, auth),
lembre que o impacto é nos três públicos ao mesmo tempo.

Contexto do sistema inteiro (arquitetura, domínio, convenções comuns): ver
[`../../CLAUDE.md`](../../CLAUDE.md) e [`../../docs/`](../../docs/) — leia antes de mexer aqui.

## Stack

Next.js 16 (App Router) + React 19 + React Compiler (babel-plugin), Bun,
Biome, Tailwind CSS 4, Radix UI + @base-ui/react (primitivos), CVA,
react-hook-form + zod (`@hookform/resolvers`), @tanstack/react-query, xior
(HTTP client), better-auth, nuqs (estado em query params), recharts.

## Comandos

```
bun install
bun run dev      # next dev
bun run build    # next build
bun run start    # next start
bun run lint     # biome check
bun run format   # biome format --write
```

Sem `bun run test` — não há testes neste repo.

## Estrutura (`src/`)

- `app/{admin,customer,producer}/(auth|dashboard)/` — rotas por papel. Cada
  role tem seu próprio fluxo de auth e seu próprio dashboard. O dashboard
  usa uma rota catch-all (`(dashboard)/[...pathname]/page.tsx`) — confira
  como o roteamento interno funciona antes de adicionar uma página nova
  (pode não ser um arquivo de rota tradicional por página).
- `containers/` — `cards/`, `charts/`, `dialogs/`, `forms/`, `layout/`, `tables/`,
  organizados por domínio dentro de cada um (ex.: `tables/safes`, `tables/quotes`).
- `components/ui/` — design system local (botões, etc. — base Radix/CVA).
- `libraries/`:
  - `api.ts` — instância `xior`, `baseURL: process.env.NEXT_PUBLIC_API_URL`,
    envia `X-Client-App` (role) e `X-timezone`, repassa cookies de auth via
    helper do `@segwise/core`.
  - `auth.ts` — integração better-auth.
  - `hooks/` — hooks de dados por domínio (`analytics`, `auth`,
    `insurance-companies`, `payments`, `producers`, `quotes`, `safes`, `vehicles`)
    — provavelmente wrappers de `@tanstack/react-query` sobre `api.ts`.
  - `schemas/` — schemas Zod locais (formulários específicos deste app; não
    duplicar o que já existe em `@segwise/core`).
  - `search-params/` — helpers de `nuqs`.
- `functions/{auth,date,sidebar}/` — utilitários puros.
- `config/` — branding, sidebar, ícones, placeholders.
- `providers/contexts/` — React Context providers globais.
- `@types/` — augmentations (`auth`, `nuqs`).

## Como as 3 roles viram 3 domínios (`src/proxy.ts`)

Não existe `app/layout.tsx` na raiz nem páginas soltas fora de
`{admin,customer,producer}/` — todo o roteamento passa por `src/proxy.ts`
(middleware do Next 16, renomeado). `ACCESS = NEXT_PUBLIC_ROLE_SYSTEM` é
fixado no build; toda requisição recebida (ex.: `/dashboard`) é reescrita
internamente para `/${ACCESS}${pathname}` (ex.: `/producer/dashboard`). Ou
seja, **o build da role `producer` só serve rotas sob `app/producer/`**,
mesmo o bundle contendo o código das outras duas — uma URL pública pensada
para o portal do produtor só funciona no domínio/deploy `producer`.

`PUBLIC_ROUTES` (match exato) e `PUBLIC_ROUTE_PREFIXES` (match por prefixo,
para rotas com segmento dinâmico tipo `/register/:slug`) no topo do arquivo
controlam quais paths não exigem sessão. Uma página pública nova sempre
precisa entrar em um desses dois — senão o proxy redireciona para
`/sign-in`.

## Busca em listagens

Busca só é aplicada com Enter ou clique na lupa (nunca a cada tecla). Use
`components/input-search.tsx` (dados da API) ou `containers/marketing/search.tsx`
(`MarketingSearch`, listas filtradas no cliente). O termo é enviado como `?search=` ao backend (busca sempre no
servidor via `parseSearch` do backend, com índice; nunca filtrando o que já foi
carregado). Detalhes em
[`../../docs/CONVENTIONS.md`](../../docs/CONVENTIONS.md).

## Integração com o backend

`src/libraries/api.ts` é o único ponto de saída HTTP. Toda chamada nova à
API deve passar por ele (não criar `fetch` solto). A env `NEXT_PUBLIC_API_URL`
aponta para o `api` deste monorepo (`apps/api`).

## Depende de @segwise/core

Schemas, tipos, máscaras, validadores e traduções vêm de `@segwise/core`
(`workspace:*`, sem versão publicada). Se faltar algo lá que você precisa (e que também
seria útil no `api` ou `mobile`), adicione no `core` primeiro — ver
[`../../packages/core/CLAUDE.md`](../../packages/core/CLAUDE.md).

## Docker / deploy

`Dockerfile` multi-stage: `turbo prune` + build com Bun → output standalone do Next
(`outputFileTracingRoot` na raiz; servidor em `apps/backoffice/server.js`) →
runtime Node 22 alpine. Buildado com **contexto na raiz do monorepo**
(`docker build -f apps/backoffice/Dockerfile --build-arg NEXT_PUBLIC_ROLE_SYSTEM=admin ...`).
O CD builda três imagens (`backoffice`, `customer`, `producer`) a partir do mesmo
Dockerfile com build args diferentes — o valor de `NEXT_PUBLIC_ROLE_SYSTEM` do painel
interno é **`admin`** — e o `deploy/docker-compose.yml` da raiz as sobe na rede externa
`dokploy-network`. Não há mais script `deploy`; subir versão é ação do
usuário — não fazer sem confirmação.

## Typecheck e lint

`bun run typecheck` roda `next typegen && tsc --noEmit` (gera os tipos do Next que
o `tsc` precisa). Não rode junto com `next build` (ambos escrevem em `.next/types`);
o Turbo já serializa (`apps/backoffice/turbo.json`). Lint via Biome (config na raiz,
aqui só ativa os domínios `next`/`react`).
