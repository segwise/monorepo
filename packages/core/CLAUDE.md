# core — CLAUDE.md (`@segwise/core`)

Lib TypeScript compartilhada, publicada como pacote npm privado no GitHub
Packages. É o **contrato de dados** entre `backend`, `backoffice` e
`application` — não roda como serviço, não tem infraestrutura própria.

Contexto do sistema inteiro: ver [`../CLAUDE.md`](../CLAUDE.md) e
[`../docs/`](../docs/) — em especial [`../docs/DOMAIN.md`](../docs/DOMAIN.md)
para o glossário de domínio que os `types`/`schemas` deste pacote representam.

## Stack

TypeScript puro, buildado com `tsc` + `tsc-alias`. Peer dependencies: `zod`,
`date-fns`, `typescript` (mesmas versões que os 3 repos consumidores esperam
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
| `scripts/bump-version.ts` | — (uso interno) | Versionamento semântico usado pelos scripts `deploy:*`. |

## Regra: o que vai para o core vs. o que fica local

**Vai para o core** quando o tipo/schema/máscara/tradução é usado (ou vai ser
usado) por mais de um dos repos consumidores — normalmente `backend` +
pelo menos um cliente (`backoffice`/`application`), porque é isso que garante
que o payload que o backend envia bate com o que o cliente espera.

**Fica local** (em `src/libraries/schemas` de cada repo) quando é específico
de uma tela/formulário de um único app e não representa um conceito de
domínio compartilhado (ex.: um schema de filtro de UI só do backoffice).

## Fluxo de alteração e publicação

```
cd core
# 1. editar src/... (schemas, types, masks, valids, translate ou utils)
# 2. build local para conferir tipos antes de publicar:
bun run build

# 3. publicar — escolha patch/minor/major conforme semver:
bun run deploy:patch   # ou deploy:minor / deploy:major
```

O que `deploy:*` faz, em ordem: `build` → `bump-version` (atualiza
`package.json`) → commit `chore: release vX.Y.Z` → tag git → push (branch +
tags) → `bun publish` (GitHub Packages) → `update-external`, que roda
`bun update @segwise/core` dentro de `../backend`, `../backoffice` e
`../application` automaticamente.

**Isso é uma ação com efeito em 4 repositórios de uma vez** (publica um
pacote público-privado e faz push em 3 outros repos). Nunca rodar
`bun run deploy:*` sem confirmação explícita do usuário — trate como um
`git push` + release, não como um comando local inofensivo.

## Ao adicionar algo novo

- Escolha o subpath certo (`schemas` vs `types` vs `utils` etc.) — não
  misture uma função utilitária dentro de `types/`, por exemplo.
- Se adicionar um novo domínio (pasta nova em `schemas/`/`types/`), replique
  o padrão dos domínios existentes (`quotes`, `safes`, etc.) incluindo
  `register/` quando fizer sentido (schema de criação vs. schema completo).
- Depois de publicar, os 3 repos consumidores já são atualizados pelo
  próprio `deploy:*` — não precisa rodar `bun update @segwise/core`
  manualmente neles, a menos que o `update-external` falhe.
