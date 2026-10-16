# api — CLAUDE.md (`@segwise/api`)
API central do sistema Segwise. É o único app que usa o banco de dados
(`@segwise/database`, em `packages/database`) — tudo que os outros apps
precisam persistir passa por aqui.
Contexto do sistema inteiro (arquitetura, domínio, convenções comuns): ver
[`../../CLAUDE.md`](../../CLAUDE.md) e [`../../docs/`](../../docs/) — leia antes de mexer aqui,
principalmente [`../../docs/DOMAIN.md`](../../docs/DOMAIN.md) para os nomes de domínio
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
# banco (schema/migrations/client ficam em packages/database; rode da raiz):
bun run db:generate       # prisma generate
bun run db:status:local   # estado das migrations no banco LOCAL
bun run db:migrate:local  # prisma migrate dev no banco LOCAL
bun run db:local -- <cmd> # qualquer comando do prisma contra o banco LOCAL
# (⚠️ prisma migrate dev|deploy|reset direto usa o DATABASE_URL do .env = banco REMOTO; ver "Migrations")
bun run auth:generate     # @better-auth/cli generate --config src/services/auth/index.ts
bun run auth:migrate      # @better-auth/cli migrate --config src/services/auth/index.ts
```
## Migrations (⚠️ leia antes de mexer em `packages/database/prisma/`)
O `.env` do backend aponta para o banco **remoto/produção**. Nunca rode
`prisma migrate dev|deploy|reset` direto contra ele. Existe um banco de
desenvolvimento **local** (Postgres nativo em `localhost:5432`, sempre disponível) só para
isso; a migration em produção é feita **pelo deploy** (o usuário sobe e o deploy aplica).
Fluxo ao alterar `packages/database/prisma/schema.prisma` (comandos da raiz):
```
bun run db:status:local          # estado do banco local (migrations pendentes)
bun run db:migrate:local -- --name nome_da_mudanca   # cria + aplica a migration no banco LOCAL
bun run db:generate              # regenera o client (não toca em banco)
bun run db:local -- <qualquer comando do prisma>     # ex.: migrate deploy, migrate reset, studio
```
- Os scripts `db:*:local` usam `packages/database/scripts/db-local.ts`, que lê a URL de
  `packages/database/.env.dev-migrate` (**não versionado**, ignorado pelo git; tem a senha, não copie
  para arquivos versionados) e **recusa rodar se o host não for local**.
- Se o `.env.dev-migrate` não existir, peça ao usuário (formato:
  `DATABASE_URL=postgresql://postgres:<senha>@localhost:5432/postgres`).
- Aviso de perda de dados (ex.: trocar tipo de coluna, drop) ou `migrate reset`, mesmo no
  banco local: pare e confirme com o usuário, e escreva a migration SQL à mão se o dado
  importar em produção (o Prisma propõe drop + recreate).
- Migration só de dados (backfill) vai em `packages/database/prisma/migrations/<timestamp>_nome/migration.sql`
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
- O modelo de dados (`schema.prisma`) e as migrations ficam em `packages/database/prisma/`; o client é importado de `@segwise/database/client` (e `/enums`, `/models`).
  Modelo de dados completo. Ver
  [`../../docs/DOMAIN.md`](../../docs/DOMAIN.md) para o significado de cada model.
## Ao adicionar uma rota/feature nova
1. Se envolve um novo formato de dado usado por mais de um app (o
   `backoffice` ou o `mobile` vão consumir esse payload), defina o
   schema/tipo no `@segwise/core` primeiro (ver
   [`../../packages/core/CLAUDE.md`](../../packages/core/CLAUDE.md)) e importe daqui.
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
sem sessão, ver [`../../docs/DOMAIN.md`](../../docs/DOMAIN.md) e o backlog em
[`../../docs/TODO.md`](../../docs/TODO.md) para o contexto do pedido), não dá pra
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
## Extração de PDFs de seguros: consistência Proposta/Apólice ↔ Endosso
Os extratores de proposta/apólice e endosso fazem parte do mesmo domínio e devem evoluir de forma sincronizada. Sempre que uma correção, fallback, normalização, schema ou validação for alterada em proposal-extract.ts, revise endorsement-extract.ts; ao alterar endorsement-extract.ts, revise também proposal-extract.ts. Não copie regras cegamente: aplique ao outro fluxo apenas quando fizer sentido para a semântica e para o contrato de saída daquele tipo de documento.
Ao corrigir qualquer problema de extração, verifique se a mesma classe de erro também pode afetar conceitos compartilhados: seguradora comercial, segurado, CPF/CNPJ, principal condutor, placa e ausência explícita de placa, modelo, ano/modelo, CEP completo ou regional, franquia principal, valores líquidos, IOF/juros/encargos, evidências retornadas pela IA, campos auxiliares opcionais, schemas Zod, normalizações e fallbacks determinísticos baseados no documento.
A IA fornece uma interpretação estruturada, mas o documento é a fonte de verdade. Campos auxiliares de evidência não devem, sozinhos, causar rejeição quando o valor puder ser confirmado com segurança no texto ou na visão. Se a IA omitir uma evidência, tente confirmar deterministicamente antes de retornar 409. Se a IA retornar um valor incorreto e o documento tiver uma estrutura inequívoca, o TypeScript pode corrigir o valor sem nova chamada ao modelo. 409 deve representar ambiguidade real, não apenas deficiência do JSON auxiliar da IA.
O schema intermediário retornado pela IA deve ser tolerante a campos auxiliares omitidos quando eles puderem ser recuperados deterministicamente. Evidências e campos auxiliares devem aceitar ausência e ser normalizados para null ou [] quando apropriado. Essa tolerância não reduz a rigidez do schema público final, que continua exigindo os campos obrigatórios e semanticamente corretos.
Para proposta/apólice, sempre revisar o impacto nos campos finais latestProposal, renewal, modality, insuranceCompany, insured, vehicle.plate, vehicle.model, vehicle.year, vehicle.usage, vehicle.overnightStayPostalCode, vehicle.driver, effectivedAt, requestedAt, expirationAt, award, installments e franchise.
Para endosso, nunca tratar todos os documentos como um único formato. Sempre avaliar individualmente os tipos suportados:
- vehicle_conductor: revisar driver, plate, model, modelYear, franchise, amount e percentage. driver representa o estado resultante do principal condutor mesmo quando a alteração principal for apenas de veículo. Se o documento disser que o principal condutor é o próprio segurado, resolver o CPF do segurado.
- address: revisar o endereço/CEP resultante. Se houver somente prefixo regional de 5 dígitos, primeiro procurar um único CEP completo correspondente no documento; se não existir nenhum, completar com zeros à direita (50630 → 50630000). Nunca inventar os três últimos dígitos.
- franchise: extrair somente a franquia principal do veículo. Não confundir com franquias de vidros, faróis, lanternas, retrovisores, acessórios ou serviços. Privilegiar contextos como Franquia - Participação Obrigatória, 25% da Normal, 50% da Obrigatória, Compreensiva, Casco, Básica e Franquia do Veículo.
- cancellation: revisar principalmente a data efetiva do cancelamento e não exigir campos de veículo, condutor, franquia ou financeiro que não façam parte semanticamente desse resultado.
No financeiro, proposta/apólice e endosso têm semânticas diferentes. Em proposta/apólice, award é o prêmio líquido antes de IOF, juros e encargos. Em endosso, amount é o efeito financeiro líquido antes de IOF, juros e encargos e pode ser positivo (cobrança), negativo (restituição) ou zero (sem movimentação). Nunca aplicar ao endosso uma regra de proposta que exija valor positivo.
Quando um novo resolvedor determinístico for criado em um fluxo, verificar imediatamente se há conceito equivalente no outro. Isso vale especialmente para resolução de placa/ausência de placa, principal condutor, CEP parcial, franquia principal, seguradora comercial, valor líquido, evidências omitidas e normalização de campos auxiliares da IA.
Não implementar correções específicas para uma seguradora ou um único PDF quando o comportamento puder ser generalizado com segurança. Preferir regras semânticas e estruturais. Considere também que parsers de PDF podem inverter a ordem visual de células e labels: a lógica não pode depender apenas de Label: Valor; quando seguro, deve aceitar também Valor antes do Label.
Antes de concluir qualquer correção de extração:
1. identificar a causa real no documento;
2. corrigir o fluxo onde o problema ocorreu;
3. revisar imediatamente o outro fluxo (proposal-extract.ts ↔ endorsement-extract.ts);
4. revisar todos os tipos de endosso potencialmente afetados;
5. revisar schema intermediário da IA, schema final, prompt, normalizações, resolvedores e validações;
6. garantir que a correção não enfraqueça a precisão nem quebre PDFs que já funcionavam;
7. preservar precisão acima de taxa de sucesso — se houver ambiguidade real, retornar 409;
8. atualizar versão/cache de todos os extratores efetivamente alterados;
9. ao entregar uma correção, fornecer os arquivos completos alterados; quando fizer sentido, entregar também o conjunto sincronizado de proposal-extract.ts, endorsement-extract.ts e pdf-extraction.ts.
Fluxo esperado: PDF → texto + visão → IA estrutura → TypeScript confirma/normaliza/corrige com base no documento → schema final → 200 ou 409. A IA nunca deve ser a única responsável por validar os próprios valores extraídos.
## Integrações externas (ver `.env.example` para a lista completa de envs)
PostgreSQL, Redis, MinIO (S3), Ollama (LLM self-hosted, `OLLAMA_*`/`AI_*`),
Resend (e-mail), APIs brasileiras de terceiros (placas, FIPE, CPF/CNPJ),
Transfeera (Pix/split de pagamento). Nunca commitar segredos — só
`.env.example` (sem valores) fica versionado.
## Docker / deploy
`Dockerfile` multi-stage com Bun + `turbo prune` + `prisma generate` + Chromium
(Playwright), buildado com contexto na raiz do monorepo
(`docker build -f apps/api/Dockerfile .`); roda como usuário não-root, **só com dependências de produção** (camada de `node_modules` separada da de código,
para o deploy baixar pouco — veja `docs/MONOREPO.md`#docker; qualquer pacote que o runtime execute, como o `prisma`
do `migrate deploy`, precisa ser `dependency`) e tem
`entrypoint.sh` (aplica `prisma migrate deploy` via `packages/database` e sobe o
servidor). Em produção o compose é o `deploy/docker-compose.yml` da raiz (api + backoffices +
Redis de `cache` em rede interna isolada + rede externa `dokploy-network`, usando as imagens
do GHCR); o Postgres e o Redis da fila (BullMQ) são Databases do Dokploy, fora dele. Não há mais script `deploy`:
subir versão é ação do usuário (ver [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md#deploy-é-uma-ação-do-usuário)) —
nunca rodar `migrate reset` ou `migrate deploy` contra produção sem confirmação.
## Busca em listagens
Todo `?search=` usa `parseSearch` (`src/functions/search/parse-search.ts`): CPF/CNPJ/celular por dígitos, e-mail por prefixo, texto com `contains` + `insensitive`, atendido por índice GIN trigram (`pg_trgm`). Nunca o `search` full-text do Prisma (não indexável). Campo novo pesquisável em tabela grande precisa de índice trigram (uma migration por índice, `CREATE INDEX CONCURRENTLY`). Ver `docs/CONVENTIONS.md`.
## Performance e índices
Toda consulta nova/alterada deve ter índice adequado (btree, composto ou GIN para full-text), validado com `EXPLAIN ANALYZE` no banco local, sem travar o banco (`CREATE INDEX CONCURRENTLY` em tabelas grandes) e sem carregar tudo para filtrar no cliente. Regra completa em `docs/CONVENTIONS.md`.