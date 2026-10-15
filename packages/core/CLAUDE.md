# core — CLAUDE.md (`@segwise/core`)

Lib TypeScript compartilhada, pacote interno do monorepo (`workspace:*`, **sem
publicação**). É o **contrato de dados** entre `api`, `backoffice` e
`mobile` — não roda como serviço, não tem infraestrutura própria.

Contexto do sistema inteiro: ver [`../../CLAUDE.md`](../../CLAUDE.md) e
[`../../docs/`](../../docs/) — em especial [`../../docs/DOMAIN.md`](../../docs/DOMAIN.md)
para o glossário de domínio que os `types`/`schemas` deste pacote representam.

## Stack

TypeScript puro, buildado com `tsc` + `tsc-alias`. Peer dependencies: `zod`,
`date-fns`, `typescript` (mesmas versões que os 3 apps consumidores esperam
ter compatíveis). Dependências próprias: `decimal.js` (cálculo monetário
preciso), `date-fns-tz`.

## Estrutura (`src/`) e o que cada subpath exporta

| Pasta | Exporta em | Conteúdo |
|---|---|---|
| `schemas/` | `@segwise/core/schemas` | Schemas Zod por domínio: `endorsement`, `financing`, `marketplace`, `payments`, `producers` (+`register`), `professions`, `profile`, `quotes` (+`register`), `safes` (+`register`), `search-params/*`, `search-queries/*`, `utils`. |
| `types/` | `@segwise/core/types` | Tipos TS espelhando os mesmos domínios + `auth`, `brokers`, `insurance-companies`, `vehicles`. |
| `masks/` | `@segwise/core/masks` | Máscaras de input: `cnpj`, `cpf`, `date`, `money`, `number`, `phone`, `plate`, `postal-code`. |
| `valids/` | `@segwise/core/valids` | Validadores: `cnpj`, `cpf`, `date`, `phone`, `plate`, `postal-code`. |
| `translate/` | `@segwise/core/translate` | Tradução de enums de domínio para português (labels de UI): `payment`, `producer`, `profession`, `quote`, `safe` (status, commission), `vehicle`, `utils`. |
| `utils/` | `@segwise/core/utils` | Funções de negócio: cálculo de parcela/percentual, geração de referral, filtros de data padrão, `cookies-relevant.ts` (usado pelo `backoffice` para repassar cookies de auth ao backend). |

## Regra: o que vai para o core vs. o que fica local

**Vai para o core** quando o tipo/schema/máscara/tradução é usado (ou vai ser
usado) por mais de um dos apps consumidores — normalmente `api` +
pelo menos um cliente (`backoffice`/`mobile`), porque é isso que garante
que o payload que o backend envia bate com o que o cliente espera.

**Fica local** (em `src/libraries/schemas` de cada app) quando é específico
de uma tela/formulário de um único app e não representa um conceito de
domínio compartilhado (ex.: um schema de filtro de UI só do backoffice).

## Fluxo de alteração

```
# 1. editar packages/core/src/... (schemas, types, masks, valids, translate ou utils)
# 2. conferir tipos de tudo que consome o core (o Turbo builda o core antes):
bunx turbo run typecheck lint
```

Não há publicação, bump de versão nem `bun update`: o `core` é consumido por
`workspace:*`, então a alteração no `core` e nos apps que a usam entra no **mesmo
commit/PR**. Os apps resolvem os subpaths pelo `dist/` do core (`exports` do
`package.json`), por isso o core precisa estar buildado — `bun run build` ou
qualquer tarefa do Turbo com `^build` faz isso. Ao mexer no core, se algo parecer
"desatualizado" no app, rebuilde: `bunx turbo run build --filter=@segwise/core`.

## Ao adicionar algo novo

- Escolha o subpath certo (`schemas` vs `types` vs `utils` etc.) — não
  misture uma função utilitária dentro de `types/`, por exemplo.
- Se adicionar um novo domínio (pasta nova em `schemas/`/`types/`), replique
  o padrão dos domínios existentes (`quotes`, `safes`, etc.) incluindo
  `register/` quando fizer sentido (schema de criação vs. schema completo).
- Depois de alterar, rode `bunx turbo run typecheck` na raiz: ele valida o core e
  todos os apps que o importam.
