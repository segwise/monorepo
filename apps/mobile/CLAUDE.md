# application — CLAUDE.md

App mobile (Expo/React Native) voltado ao segurado final. Nome do pacote é
literalmente `segwise` (`package.json` → `name: "segwise"`).

Contexto do sistema inteiro (arquitetura, domínio, convenções comuns): ver
[`../CLAUDE.md`](../CLAUDE.md) e [`../docs/`](../docs/) — leia antes de mexer aqui.

## Stack

Expo SDK ~55 + Expo Router, React Native 0.83, React 19, Bun, Biome,
NativeWind (Tailwind para RN), react-native-reanimated + worklets,
react-hook-form + zod, @tanstack/react-query, xior (via `expo/fetch`), MMKV
(storage local), @rn-primitives (primitivos estilo Radix para RN),
hot-updater (OTA updates fora da loja).

## Comandos

```
bun install
bun run prebuild   # expo prebuild --clean — regenera android/ e ios/
bun run ios        # expo run:ios
bun run android    # expo run:android
bun run start       # prebuild + run:ios
```

Builds de produção/preview via EAS (`eas.json`, perfis
development/preview/production) — não coberto pelos scripts do `package.json`,
usar `eas build`/`eas submit` diretamente quando for o caso. Sem testes
automatizados.

## Estrutura (`src/`)

- `app/(stacks)/` — grupos de rotas por área de negócio: `(buying-and-selling)`,
  `(insurances)`, `(request-quote)`, `(required-reading)`, `(useful-contacts)`,
  `(vehicle-inquiry)`, `(what-to-do)`. Ver [`../docs/DOMAIN.md`](../docs/DOMAIN.md)
  para o que cada área cobre.
- `containers/home/` — composição da tela inicial.
- `components/ui/` — design system local (base @rn-primitives).
- `contexts/providers/` — providers React globais.
- `functions/api/{financing,insurance-companies,marketplace,quotes,referral,safes}/`
  — funções por domínio que chamam a API.
- `functions/attribute-referral.ts`, `share-app.ts` — lógica de indicação/compartilhamento.
- `libraries/`:
  - `api.ts` — cliente `xior`, `baseURL: environment.API_URL`, usa `expo/fetch`.
  - `environment.ts` — leitura tipada das envs `EXPO_PUBLIC_*`.
  - `hooks/api/` — hooks de dados por domínio (React Query).
  - `schemas/` — schemas Zod locais deste app.
  - `storage/` — wrapper MMKV.
- `data/states.json` — dados estáticos (estados brasileiros).
- `configs/consts/` — constantes.

## Integração com o backend

`src/libraries/api.ts` + `environment.ts` são o único ponto de saída HTTP.
Envs relevantes: `EXPO_PUBLIC_API_URL` (aponta para `../backend`) e
`EXPO_PUBLIC_COMPANY_ID` (multi-tenant por empresa — confirmar com o backend
o que esse ID representa antes de assumir).

## Depende de @segwise/core

Mesma regra do `backoffice`: schemas/tipos/máscaras/validadores vêm do
`@segwise/core`. Ver [`../core/CLAUDE.md`](../core/CLAUDE.md).

## OTA updates (hot-updater)

Distribuição de updates JS sem passar pela App Store/Play Store, via bucket
S3 próprio (`HOT_UPDATER_S3_*` no `.env.example`) e canal (`HOT_UPDATER_CHANNEL`).
Mudanças que exigem novo código nativo (nova lib nativa, mudança em
`android/`/`ios/`) **não** podem ir só por OTA — precisam de build EAS novo.
Tenha isso em mente ao avaliar se uma mudança pode ser hotfixada via
hot-updater ou exige submissão às lojas.

## Deploy

`bun run deploy` só faz `git add/commit/push` — não builda nem publica nada
sozinho. Não rodar sem confirmação explícita do usuário.
