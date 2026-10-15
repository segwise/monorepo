# mobile — CLAUDE.md (`@segwise/mobile`)

App mobile (Expo/React Native) voltado ao segurado final. Nome do pacote
é `@segwise/mobile` (a pasta antiga se chamava `application`).

Contexto do sistema inteiro (arquitetura, domínio, convenções comuns): ver
[`../../CLAUDE.md`](../../CLAUDE.md) e [`../../docs/`](../../docs/) — leia antes de mexer aqui.

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
  `(vehicle-inquiry)`, `(what-to-do)`. Ver [`../../docs/DOMAIN.md`](../../docs/DOMAIN.md)
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
Envs relevantes: `EXPO_PUBLIC_API_URL` (aponta para `apps/api`) e
`EXPO_PUBLIC_COMPANY_ID` (multi-tenant por empresa — confirmar com o backend
o que esse ID representa antes de assumir).

## Depende de @segwise/core

Mesma regra do `backoffice`: schemas/tipos/máscaras/validadores vêm do
`@segwise/core` (`workspace:*`). Ver [`../../packages/core/CLAUDE.md`](../../packages/core/CLAUDE.md).

## OTA updates (hot-updater)

Distribuição de updates JS sem passar pela App Store/Play Store, via bucket
S3 próprio (`HOT_UPDATER_S3_*` no `.env.example`) e canal (`HOT_UPDATER_CHANNEL`).
Mudanças que exigem novo código nativo (nova lib nativa, mudança em
`android/`/`ios/`) **não** podem ir só por OTA — precisam de build EAS novo.
Tenha isso em mente ao avaliar se uma mudança pode ser hotfixada via
hot-updater ou exige submissão às lojas.

## Monorepo: React próprio e dependências explícitas

- O React do mobile vem do catalog `mobile` (raiz): versão **exata** exigida pelo
  React Native/Expo, independente dos apps web. Para subir o Expo, altere só esse
  catalog (ver [`../../docs/MONOREPO.md`](../../docs/MONOREPO.md#react-por-plataforma-catalogs)).
- O Bun usa linker isolado: **declare no `package.json` do mobile tudo que importar**
  (ex.: `@expo/vector-icons`, `expo-file-system`, `@react-navigation/native-stack`).
  Hoisting não existe aqui; não ative `linker = "hoisted"` (quebra o NativeWind).
- Uploads multipart: `new File(uri)` do `expo-file-system` + `fetch` de `expo/fetch`
  (ainda a validar em dispositivo real).
- `bun run typecheck` e `bun run lint` (Biome na raiz) precisam passar.
- `expo prebuild` gera `ios/` e `android/` (gitignored, muito grandes). Xcode 27 exige
  `IPHONEOS_DEPLOYMENT_TARGET=16.0` na linha de comando por causa de pods antigos.

## Deploy

Não há script `deploy`. Builds de loja via EAS (rodar a partir de `apps/mobile`) e
updates OTA via hot-updater — nenhum dos dois foi validado ainda no monorepo. Não
disparar build/publicação sem confirmação explícita do usuário.
