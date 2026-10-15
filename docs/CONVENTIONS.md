# Convenções comuns aos 4 repositórios

## Runtime e ferramentas

- **Bun** é o runtime/gerenciador de pacotes em todos os repos (não usar npm/yarn/pnpm).
  Instale dependências com `bun install`, rode scripts com `bun run <script>`.
- **Biome** é o linter/formatter em todos os repos (não ESLint, não Prettier).
  Rode `biome check` (lint) e `biome format --write` (format). Indentação por
  padrão: tab, largura 2. Aspas simples em JS/TS/JSX (ver `biome.json` de
  cada repo para confirmar overrides).
- **TypeScript** em todos, sem exceção — não introduzir JS puro.
- **Zod v4** para validação de esquema em todos.
- **date-fns + date-fns-tz** para manipulação de datas — não usar `Date` nativo
  para cálculos, nem `moment`/`dayjs`.

## Estrutura de pastas (padrão repetido em backend/backoffice/application)

Os três repos executáveis compartilham uma convenção de pastas dentro de `src/`:

- `libraries/` — infraestrutura interna (cliente HTTP, auth, cache, storage,
  schemas locais, hooks de dados).
- `functions/` — funções utilitárias puras, organizadas por domínio.
- `containers/` (frontend) — componentes de página/feature, um passo acima de `components/ui`.
- `components/ui/` — design system local (primitivos reutilizáveis).
- `config/` ou `configs/` — constantes, ícones, branding.
- `@types/` — augmentations e tipos globais do projeto (além dos que já vêm do `core`).

Ao adicionar uma feature nova, siga essa mesma divisão em vez de criar uma
estrutura ad-hoc.

## @segwise/core — regra de dependência

Sempre que precisar de um tipo, schema Zod, máscara de input, validador de
documento (CPF/CNPJ/placa/CEP) ou tradução de enum que **mais de um repo vai
usar**, isso pertence ao `core`, não a uma cópia local. Ver
[`ARCHITECTURE.md`](ARCHITECTURE.md#regra-de-ouro-do-monorepo-lógico) e
`core/CLAUDE.md` para o fluxo de publicação.

Se o tipo/schema é usado só dentro de um único repo (ex.: um schema de
formulário específico de uma tela do backoffice), ele fica local em
`src/libraries/schemas` daquele repo — não precisa subir para o `core`.

## Commits e deploy

- Commits neste projeto historicamente não seguem Conventional Commits de
  forma rigorosa nos repos de app (mensagens genéricas via script `deploy`).
  O `core` é exceção: `deploy:patch/minor/major` gera mensagens
  `chore: release vX.Y.Z` automaticamente.
- **Nunca rode `bun run deploy`** (em backend/backoffice/application) nem
  `bun run deploy:patch|minor|major` (em core) sem confirmação explícita do
  usuário — esses scripts fazem push real e, no caso do core, publicam um
  pacote e atualizam os outros 3 repos automaticamente. Ver
  [`ARCHITECTURE.md`](ARCHITECTURE.md#convenção-de-deploy-script-npm-não-é-deploy-de-verdade-sozinho).

## Variáveis de ambiente

Cada repo tem um `.env.example` na raiz — é a fonte de verdade de quais envs
existem. Nunca commitar um `.env` real. Ao adicionar uma nova env var,
atualize o `.env.example` correspondente no mesmo commit.

## Campo de busca em listagens (backoffice)

Toda busca textual segue o padrão de Propostas (`components/input-search.tsx`):
digitar **não** filtra; só **Enter** ou o botão de lupa à direita aplicam o
termo (que vai para o query param `search` via nuqs). O "X" vermelho limpa. Em
telas com dados da API use `InputSearch`; em listas filtradas no cliente
(Marketing, Usuários) use `MarketingSearch` (`containers/marketing/search.tsx`),
que tem o mesmo comportamento e visual. Não crie inputs de busca que filtram a
cada tecla — reaproveite um desses dois.

**REGRA: a busca é sempre no servidor e sempre com índice.** O termo vai como
`?search=` na requisição, o backend filtra no banco e o hook inclui o termo na
`queryKey` (com `placeholderData: keepPreviousData`). Nunca filtre o texto
digitado em cima do que já foi carregado: isso só enxerga a primeira
consulta/página. Filtros secundários (status, perfil, UF...) podem ser no
cliente apenas enquanto a lista vier inteira numa resposta só.

Critério único (`parseSearch`, em `backend/src/functions/search/parse-search.ts`):
CPF/CNPJ/celular comparados pelos dígitos, e-mail por prefixo (`startsWith`,
minúsculo) e o restante como `contains` + `mode: 'insensitive'` (ILIKE
`%x%`). **Não use o `search` (full-text) do Prisma**: ele gera
`to_tsvector(concat_ws(' ', col))`, que não é IMMUTABLE e por isso não aceita
índice (medido: 1,2 s com 1 milhão de linhas, varredura da tabela inteira).

O `ILIKE '%x%'` só é rápido com índice **GIN trigram** (`pg_trgm`, extensão já
habilitada): 527 ms → 10 ms com 1 milhão de linhas. Todo campo de texto
pesquisável em tabela que pode crescer precisa dele (hoje: `insureds` nome e
celular, `temporary_insureds` nome e celular, `users` nome,
`marketplace_vehicles` modelo). Tabelas pequenas ou já restritas por
corretora/campanha (campanhas, contatos, produtores, seguradoras) não precisam.
Campo novo pesquisável em tabela grande = índice novo (ver abaixo).

## Performance de consultas e índices (regra)

Toda consulta nova ou alterada deve pensar em volume (milhares/milhões de
registros), velocidade e peso no banco:

- Toda coluna usada em `where`, `orderBy`, junção ou busca precisa de índice
  adequado ao tipo de consulta: btree (`@@index`) para igualdade, prefixo e
  ordenação; índice composto na ordem em que a consulta filtra; GIN para
  full-text (`search`). Se a consulta nova não é atendida por um índice
  existente, crie o índice na mesma entrega (migration), nunca "depois".
- Valide que o índice é de fato usado (`EXPLAIN ANALYZE` no banco local) antes
  de dar por concluído. Índice que o planner não usa só pesa a escrita.
- Listagens paginadas (cursor) e com `select` só dos campos necessários;
  nada de carregar tabelas inteiras para filtrar no cliente.
- Evite `contains`/`ILIKE '%x%'`, `OR` sobre colunas sem índice, `count` total
  em tabelas grandes sem necessidade e N+1 (use `include`/`select` ou uma
  consulta em lote).
- Índices em tabelas grandes de produção devem ser criados sem travar escritas
  (`CREATE INDEX CONCURRENTLY IF NOT EXISTS`). O `CONCURRENTLY` não roda em
  transação e o Postgres trata um arquivo com vários comandos como uma
  transação só: **um único comando por migration** (um índice = uma pasta).
  Aviso ao usuário antes do deploy.
- Os índices GIN trigram existem só nas migrations (o Prisma não os declara no
  `schema.prisma`). Por isso nunca rode `prisma migrate dev` para gerar
  migration sem revisar o SQL: ele pode propor remover esses índices. Use
  `db:migrate:local` (deploy de migrations existentes).
- Migrations só no banco local (ver `backend/CLAUDE.md`); a produção recebe pelo
  deploy.

## Datas e colunas `@db.Date` (regra)

- O backend roda sempre em UTC (e o `Dockerfile` define `ENV TZ=UTC`) (`libraries/force-utc.ts`, importado primeiro em
  `src/index.ts`): o driver do Postgres serializa `Date` no fuso do processo e,
  em coluna `date`, isso deslocava o dia do filtro entre dev (Brasil) e produção
  (UTC). Fuso do usuário vem só de `X-timezone` (`ctx.timezone`).
- Filtro de intervalo em coluna `@db.Date` (`Safe.expiration`, `effectivedAt`,
  `canceledAt`) usa **fim inclusivo**: `{ gte: dia inicial, lte: dia final }` com
  `expirationRange` (`functions/date/expiration-range.ts`). Nunca `lt:
  endOfDay(fim)`: o valor vira só a data e o último dia do intervalo some (ex.:
  propostas que vencem no dia 31 não apareciam no filtro do mês).
- O front manda intervalos de dia **sempre com `startOfDay` local nas duas pontas**
  (meia-noite do dia escolhido; nunca `endOfDay`): o backend extrai a data UTC
  desses instantes (no Brasil meia-noite local = 03:00Z, mesmo dia). Atenção: o
  `nuqs` lê o parâmetro com o schema do core (`SchemaDateRange`), que transforma o
  fim em `endOfDay` local (23:59:59.999 = dia seguinte em UTC). Por isso toda
  requisição que envia um intervalo lido do `nuqs` passa por `toDayRangeParam`
  (`functions/date/day-range.ts`) antes de ir para a API (já aplicado em
  `use-safes` e `use-safes-print`). Medido: sem isso o filtro de outubro trazia
  também 01/11.
- Valores "padrão" de filtro de data (hoje / mês atual) em schema ou rota do
  backend **nunca são constantes de módulo** (congelam na data em que o servidor
  subiu): use `getDefaultFilterDate()` do core (função, avaliada a cada
  requisição; em schema Zod `.default(getDefaultFilterDate)`).
- "Hoje" no backend para colunas `date` é o dia do usuário (`dayKey(now,
  ctx.timezone)` em UTC 00:00), não o dia UTC.
- Colunas `timestamptz` (`Quote.requestedAt`, `statusAt`...) filtram por dia **no
  fuso do usuário**: `timestampRange` (`functions/date/timestamp-range.ts`) usa o
  rótulo do dia UTC que o schema entrega e converte início/fim para o fuso de
  `X-timezone`; no dashboard é `buildRange`. Nunca `startOfDay`/`endOfDay` do
  servidor (UTC) em `timestamptz`: deslocava 3h (um registro das 23:30 de 31/10 em
  Brasília saía de outubro).
- Cadastro de cotação grava `requestedAt` no fuso do usuário (hoje = agora; outro
  dia = 00:00 desse dia no fuso dele). Proposta (`Safe.requestedAt`) continua em
  00:00 UTC do dia escolhido (a data é o que vale; ver `DASHBOARD.md`).

## Testes e CI

Não existem hoje. Se o usuário pedir para adicionar testes ou CI, é uma
decisão nova de projeto — não há padrão anterior para replicar, então vale
perguntar preferências (framework de teste, se roda no Dokploy ou precisa de
GitHub Actions, etc.) antes de estruturar.

## Rotas protegidas × rotas públicas do app (regra)

O app do segurado (`application`) usa algumas rotas **sem login**:
`GET /safes/simple?ids=…`, `GET /safes/simple/registration`,
`GET /safes/simple/plate/:placa`, `POST /quotes/simple`,
`GET /quotes/simple/plate/:placa`, `/marketplace`, `/producers/public*`.
`/safes` (resto), `/analytics`, `GET /quotes/simple`, `GET /producers/simple*` e
`/auth/profile` exigem sessão (`requireSession`). Ao proteger uma rota, confira
os clientes (backoffice e app) antes: nunca `base.use(path)` (pega todos os
métodos), use `base.get(path)`. Chamadas do backoffice à API sempre pelo `api`
(`xior`) ou, se precisar de `fetch` (upload), com `credentials: 'include'` e os
cabeçalhos `X-Client-App`/`X-timezone`.

## Placas

Placas são gravadas **em minúsculas e sem hífen** (`sou2e23`); o front exibe e
envia em maiúsculas. Toda comparação de placa no backend normaliza com
`.replaceAll('-', '').toLowerCase()` e, quando faz sentido, olha também a placa
alternativa (antiga × Mercosul) do `Vehicle`. Busca de proposta por placa estava
quebrada por comparar em maiúsculas (nenhuma proposta era achada).

## Produtor de teste (`EXCLUDED_PRODUCER_ID`)

O produtor "produtor de teste" (`019f249d-8880-7000-b962-aace743e68e2`) fica fora
de listagens (propostas, cotações), do dashboard e da checagem de duplicidade no
cadastro de proposta; os dados dele permanecem no banco. Ao criar consulta nova
sobre `Safe`/`Quote`, aplique a mesma exclusão (`EXCLUDED_PRODUCER_ID` em
`libraries/dashboard/metrics.ts`). Ainda NÃO excluem: pagamentos dele
(resumo financeiro/fluxo de caixa) e as consultas do app do segurado por
placa/CPF — ver decisão pendente.
