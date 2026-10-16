# Arquitetura do sistema Segwise

## Visão geral

Insurtech de seguros automotivos. Um monorepo (Bun workspaces + Turborepo) com
três apps (`api`, `backoffice`, `mobile`) e dois pacotes internos (`@segwise/core`,
`@segwise/database`). Os clientes falam com a API central (`apps/api`) por HTTP;
o contrato de dados é compartilhado via `@segwise/core` (`workspace:*`). Detalhes de
ferramentas e comandos em [`MONOREPO.md`](MONOREPO.md).

```
┌─────────────┐     ┌──────────────┐
│  backoffice │     │    mobile    │   clientes HTTP
│  (Next.js)  │     │(Expo/React   │
│             │     │   Native)    │
└──────┬──────┘     └──────┬───────┘
       │   importam @segwise/core   │
       │   (schemas/tipos/masks)    │
       ▼                            ▼
       │        HTTP (xior)         │
       └──────────────┬─────────────┘
                       ▼
                 ┌───────────┐
                 │    api    │  (Hono + Bun)
                 │           │──imports @segwise/core também
                 └─────┬─────┘
                        │
        ┌───────┬───────┼────────┬─────────────┐
        ▼       ▼       ▼        ▼             ▼
   PostgreSQL  Redis  MinIO   Ollama (LLM)  APIs 3ºs (FIPE,
   (Prisma)   (cache) (S3)   self-hosted    placas, CPF/CNPJ,
                                             Transfeera/Pix, Resend)
```

`core` não roda como serviço — é um pacote interno (`packages/core`), consumido por
`workspace:*` pelos três apps (sem publicação nem versionamento). O `database`
(`packages/database`) também é interno e só é usado pelo `api`.

## Papel de cada app/pacote

### packages/core
Lib TS pura. Exporta subpaths: `.`, `./schemas`, `./types`, `./masks`,
`./valids`, `./translate`, `./utils`. Contém o contrato de dados do domínio
de seguros (ver [`DOMAIN.md`](DOMAIN.md)) e utilitários de validação/máscara
de documentos brasileiros (CPF, CNPJ, placa, CEP). Não tem infraestrutura
própria (sem Docker) porque não é executável.

### apps/api
API central. Stack: Hono (framework HTTP) + Bun (runtime, roda TS nativo,
sem transpile) + Prisma 7 com `@prisma/adapter-pg` (PostgreSQL). O banco
(schema, migrations e client) vive em `packages/database`; é o único app que o usa —
nenhum outro persiste dados diretamente.

Integrações externas do `api`:
- **PostgreSQL** via `DATABASE_URL` — dados transacionais (Prisma).
- **Redis** via `CACHE_URL` — cache e sessões do better-auth (serviço `cache`, `maxmemory 512mb` +
  `volatile-lru`: só expulsa chaves com TTL, preservando consultas pagas de CPF/CNPJ sem TTL).
- **Redis** via `QUEUE_URL` — filas BullMQ. É um Database Redis do Dokploy **fora do compose**
  (AOF + `maxmemory-policy noeviction`), para o ciclo de vida e o backup não dependerem do deploy.
- **MinIO** (S3-compatible) — armazenamento de arquivos/PDFs.
- **Ollama** (`OLLAMA_BASE_URL`/`AI_BASE_URL` no compose) — LLM self-hosted.
  - Extração de dados de PDF — propostas (`apps/api/src/routers/services/safes/extract-pdf.ts`)
    e endossos (`endorsements/extract-pdf.ts`). A orquestração é compartilhada em
    `apps/api/src/libraries/ai/pdf-extraction.ts`. O modelo é chamado via **9Router**
    (`AI_BASE_URL`, compatível com OpenAI; `GET /models` lista os modelos). Etapas, da
    mais rápida para a mais completa; resposta inválida (Zod) escala para a próxima
    em vez de repetir o prompt, e só erro transitório (rede, 408/409/429, 5xx) é
    retentado — 400/401/403/404 (modelo inválido, chave errada) falham na hora:
    1. `text-fast`: texto das `AI_TEXT_PAGES` páginas (padrão 3) com mais dados (CPF,
       CNPJ, datas, R$, CEP; a 1ª página sempre entra), sem pagar tokens de cláusulas.
    2. `text-full`: texto de todas as páginas.
    3. `vision`: texto + imagens das 6 primeiras páginas (`libraries/pdf/render-pages.ts`);
       PDF escaneado (sem texto) vai direto para cá.
    Variáveis: `AI_MODEL` (1ª etapa, rápida), `AI_MODEL_FALLBACK` (etapas `text-full` e
    `vision`, um modelo mais forte para quando a 1ª falha; padrão = `AI_MODEL`),
    `AI_MODEL_VISION` (etapa com imagem, precisa de visão; padrão = `AI_MODEL_FALLBACK`),
    `AI_VISION_MODE` (`fallback` padrão | `always` | `off`), `AI_TEXT_PAGES`.
    Os prompts são **autossuficientes** (descrevem o formato do JSON): o antigo modelo
    `reader-pdf` carregava ~6 mil tokens de instruções embutidas no servidor, ignorava
    `max_tokens` e escrevia ~45 tokens/s, o que mascarava prompts incompletos e deixava
    tudo lento. A resposta é curta de propósito (JSON minificado; na proposta a seguradora
    volta como **índice** da lista e id/nome/CNPJ vêm do banco): o tempo é dominado pelos
    tokens de saída. Placa fora do padrão (ex.: "A AVISAR") vira `null`. Nascimento ausente
    é buscado por CPF/CNPJ em paralelo e, se falhar, fica nulo. Logs `[ai]` (tokens) e
    `[extract-pdf]`/`[extract-endorsement]` (etapa, tentativas e tempos). Cache Redis em
    `pdf-extract:v3:<hash>` e `endorsement-pdf-extract:v2:<hash>` (24 h).
    **Escolha de modelo (benchmark de 17 PDFs sintéticos × 21 campos, com gabarito):**
    cobre zero km "A AVISAR", segurado ≠ condutor, PJ/CNPJ, moto, caminhão, táxi não
    emplacado, seguradora do mesmo grupo (cabeçalho Azul, rodapé Porto), várias franquias,
    "prêmio líquido" x "líquido total" x total com IOF, CEP cortado, à vista, ano fab/modelo,
    placa antiga, uso particular, dados só na página 4 e escaneados. Resultado (3 passadas):
    `kr/claude-sonnet-4.5` 100/100/100 % · ~4,3 s · `kr/claude-haiku-4.5` 100/100/99,7 % ·
    ~3,2 s (~3,4 s em doc longo, ~45 % mais rápido) · `reader-pdf` 100/100 % · ~4,2 s (~6 s
    em doc longo). Fora: `haiku-4.5-thinking` 88 % e lento (raciocínio atrapalha),
    `deepseek-3.2` e `glm-5` sem visão (falham em escaneado), `qwen3-coder-next` 86 %
    (inventa proposta anterior, erra seguradora do grupo). Na conta Kiro atual
    `kr/claude-opus-*`, `kr/claude-sonnet-5`, `kr/MiniMax-M2.5` e `kr/gpt-5.6-*` aparecem
    no catálogo mas respondem 400 "Invalid model". Recomendado: `AI_MODEL=kr/claude-haiku-4.5`
    + `AI_MODEL_FALLBACK=kr/claude-sonnet-4.5`. Limites do teste: documentos sintéticos, e a
    consulta de nascimento foi simulada. Um valor errado porém válido no schema não é
    detectado (só resposta inválida escala de etapa).
    Lições de prompt (valeram para todos os modelos, ~80 % → ≥ 94 %): condutor "o próprio
    segurado" repete os dados do segurado em `driver`; CEP de pernoite cortado usa o CEP do
    segurado se começar igual, senão completa com zeros; `modality` é só veículo/moto/caminhão
    (táxi/aplicativo vai em `usage`); à vista = 1 parcela; "só lazer" = `leisure`.
- **Resend** — envio de e-mail transacional (templates React Email/Handlebars).
- **Playwright + Chromium** — geração/scraping de PDF (instalado no Dockerfile).
- **APIs brasileiras de terceiros**: `APIPLACAS_TOKEN` (placas), `CPFCNPJ_TOKEN`,
  `PLACA_FIPE_TOKEN` (tabela FIPE).
- **Transfeera** — pagamentos via Pix, incluindo split de pagamento entre
  partes (`TRANSFEERA_PAYMENT_SPLIT_PIX*`).
- Deep links para apps mobile: `IOS_APP_URL`/`ANDROID_APP_URL` (app
  `mobile` deste monorepo) e `IOS_XCAR_APP_URL`/`ANDROID_XCAR_APP_URL`
  (um segundo app "xcar", irmão de produto, que **não está** neste
  monorepo — se precisar dele, pergunte ao usuário onde fica).

### apps/backoffice
Next.js 16 / React 19, App Router. **Uma única base de código, três
deployments** diferenciados só pela env var `NEXT_PUBLIC_ROLE_SYSTEM`
(`admin` | `customer` | `producer`), ver `deploy/docker-compose.yml` — três
serviços (imagens `backoffice`, `customer` e `producer`) buildados do mesmo `Dockerfile`, cada
um com esse build arg distinto:
- `admin` → backoffice interno (painel da corretora).
- `customer` → portal do segurado/cliente.
- `producer` → portal do produtor/corretor.

Roteamento em `src/app/{admin,customer,producer}/(auth|dashboard)`, refletindo
os três papéis dentro do mesmo app.

### apps/mobile
App mobile (Expo/React Native, Expo Router) voltado ao segurado final.
Features: cotação de seguro, indicação/referral (`attribute-referral.ts`,
`share-app.ts`), anúncios, consulta de veículo. Build via EAS; atualizações
OTA (fora das lojas) via `hot-updater` com storage próprio em S3.

## Autenticação

`better-auth` é usado tanto no `backend` (gera/migra o schema de auth via
`@better-auth/cli`, models `User`/`Session`/`Account`/`Verification` no
Prisma) quanto no `backoffice` (client-side). A sessão trafega via cookies;
`backoffice` repassa os cookies relevantes nas chamadas HTTP ao backend
usando um helper que vem do `core` (`cookies-relevant.ts`). Cada role
(`admin`/`customer`/`producer`) tem seu próprio fluxo de auth dentro do
mesmo Next.js app (`(auth)` route groups).

`mobile` ainda não foi confirmado se usa `better-auth` — checar
`src/libraries/storage` e o fluxo de login do app antes de assumir.

## Deploy e infraestrutura

- **CI/CD**: ainda não implementado (não há `.github/workflows`). O plano — CI no
  GitHub Actions com Kodus como quality gate e CD híbrido com Dokploy — está em
  [`MONOREPO.md`](MONOREPO.md#cicd-planejado).
- **api** e **backoffice**: Dockerfile multi-stage (Bun + `turbo prune`), buildado com
  **contexto na raiz do monorepo** (`docker build -f apps/<app>/Dockerfile .`). O CD publica as
  imagens no GHCR (`ghcr.io/segwise/{api,backoffice,customer,producer}`) e o Dokploy roda **um
  compose único** (`deploy/docker-compose.yml`: api, backoffice, customer, producer e o Redis `cache` em rede
  interna) numa rede Docker externa `dokploy-network`. O **Postgres e o Redis da fila ficam fora do
  compose**, como Databases do Dokploy (backup e ciclo de vida independentes do deploy). As migrations (`prisma migrate deploy`) rodam no serviço `migrate`
  (imagem `ghcr.io/segwise/migrate`), que termina antes de a api subir. Detalhes em [`MONOREPO.md`](MONOREPO.md#cicd).
- **mobile**: sem Docker (é app mobile). Build/submit via `eas.json`
  (perfis development/preview/production). Updates OTA via `hot-updater`
  (bucket S3 próprio, fora do fluxo de loja).
- **core** e **database**: sem infra própria — são pacotes internos.

## Deploy é uma ação do usuário

Os antigos scripts `deploy` (`git add . && git commit && git push`) foram removidos.
Subir uma versão (o merge na `main` que aciona o CD, ou o disparo manual do workflow
CD / do deploy no Dokploy) é uma ação com efeito em
produção: **peça confirmação antes**, nunca faça por conta própria.

## O que verificar antes de confiar cegamente neste documento

Este documento foi escrito a partir de uma inspeção do código em 2026-09-23 e
atualizado na migração para monorepo (2026-10). Antes de tomar decisões
arquiteturais importantes com base nele, confirme que os arquivos citados
(`deploy/docker-compose.yml`, `.env.example`, `package.json` de cada app) ainda dizem o
mesmo — o sistema evolui e este arquivo pode ficar desatualizado.
