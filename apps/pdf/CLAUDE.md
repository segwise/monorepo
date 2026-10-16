# pdf — CLAUDE.md (`@segwise/pdf`)

Serviço HTML → PDF (Chromium + Playwright), isolado da `api`. Não conhece o domínio: recebe HTML
pronto e devolve bytes de PDF. Quem monta o HTML (Handlebars, dados do banco) é a `api`.

Contexto do sistema: [`../../CLAUDE.md`](../../CLAUDE.md) e [`../../docs/MONOREPO.md`](../../docs/MONOREPO.md).

## Stack
Node 24 (executa TypeScript direto, sem build) + `playwright-core` (navegador do sistema, em
produção o Chromium do Alpine) + `zod`. Sem framework HTTP: `node:http`.

## Comandos
```
bun run dev        # node --watch src/index.ts (use CHROMIUM_PATH=<chromium> se não houver o do Playwright)
bun run typecheck
bun run lint
```

## API
- `GET /health` → 200 se o Chromium está de pé (sem autenticação; só rede interna).
- `POST /render` com `Authorization: Bearer $PDF_TOKEN` e JSON `{ html, options? }` → `application/pdf`.
  `options`: `format` (`A4`|`Letter`), `printBackground`, `margin` (px/in/cm/mm), `pageRanges`, `timeoutMs` (≤ 120 s).
  Erros: 400 (inválido), 401, 413 (> `MAX_BODY_BYTES`), 503 (fila cheia, `Retry-After`), 504 (timeout), 500.

## Regras de segurança (não relaxar sem decidir junto)
- Um contexto do Chromium **novo por pedido**, com `javaScriptEnabled: false` e `offline: true`. O HTML
  tem que ser autossuficiente: CSS embutido e imagens `data:` (ver `apps/api/src/libraries/pdf`).
- O serviço só roda numa rede do compose com `internal: true` (sem saída para a internet e sem Traefik).
- Em produção o boot exige `PDF_TOKEN` (≥ 16 caracteres). Nunca logar o HTML.

## Variáveis
`PORT` (3000), `PDF_TOKEN`, `MAX_CONCURRENCY` (4), `MAX_BODY_BYTES` (20 MB), `CHROMIUM_PATH`.
