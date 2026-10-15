# TODO / backlog de melhorias

Itens identificados durante exploração do código, para tratar depois (não
são urgentes, mas não devem ser esquecidos). Cada item tem a origem
(quando/como foi encontrado) para dar contexto quando formos retomar.

## Produtores (backoffice)

Identificado em 2026-09-23, durante levantamento de contexto da área de
Produtores antes de começar a trabalhar nela.

- [ ] **Botão "olho" (visualizar) na tabela de produtores não mostra nada
  de fato.** `DialogProducerRegister` recebe a prop `id` mas a desestrutura
  como `id: _id` (não usada) — hoje ele sempre abre o dialog de **cadastro**
  vazio, mesmo clicando para "ver" um produtor existente. Falta implementar
  view/edit real usando esse `id`.
  Arquivo: `apps/backoffice/src/containers/dialogs/producers/register.tsx`
  (chamado a partir de `apps/backoffice/src/containers/tables/producers/simple.tsx`).

- [ ] **Dropdown de ações ("...") na tabela está vazio.**
  `<DropdownMenuContent align='end' />` sem nenhum `DropdownMenuItem` —
  botão existe mas não faz nada. Definir quais ações fazem sentido aqui
  (editar, desativar, reenviar convite, etc.) antes de implementar.
  Arquivo: `apps/backoffice/src/containers/tables/producers/simple.tsx`.

- [ ] **Status "Ativo" fixo/hardcoded na tabela**, não reflete o estado real
  do produtor. Hoje o fluxo é: `POST /producers` cria um `User` + um
  `Invitation` (não cria o `Member` diretamente) — um convite pendente
  (ainda não aceito) provavelmente deveria aparecer como "Pendente", não
  "Ativo". Verificar se há como diferenciar `Member` (aceito) de
  `Invitation` (pendente) na resposta de `/producers/simple` e refletir
  isso na UI.
  Arquivos: `apps/backoffice/src/containers/tables/producers/simple.tsx`,
  `apps/api/src/routers/services/producers/listinig.ts`.

- [ ] **Select "Tipo de Pagamento" só oferece a opção "Mensal"** — as
  opções semanal (`weekly`) e quinzenal (`bi_weekly`) de
  `SchemaProducerTypeOfPayment` estão comentadas no JSX. Confirmar se é
  intencional (regra de negócio) ou só um corte temporário, e reabilitar se
  fizer sentido.
  Arquivo: `apps/backoffice/src/containers/dialogs/producers/register.tsx`
  (linhas do `<Select>` de `typeOfPayment`).

- [x] ~~**Bug: `register.ts` (fluxo do admin) pode apagar um usuário
  pré-existente por engano.**~~ Corrigido em 2026-10-03: os três cadastros (interno,
  admin e link público) usam `functions/producers/find-or-create-producer-user.ts`,
  que informa se o usuário foi criado agora e só esse é desfeito em caso de erro.
  Na mesma revisão: o `createUser` do better-auth não gravava CPF/CNPJ nem celular
  (campos do topo do corpo são ignorados), então a busca por CPF nunca achava o
  usuário e um segundo cadastro dava "User already exists"; agora são gravados
  explicitamente. Cobertura: bateria de ponta a ponta em Postgres/Redis
  descartáveis (45 verificações), que vale repetir ao mexer nesses fluxos.

- [ ] **Chave PIX aceita vazio no cadastro de produtor/parceiro.**
  `pix: z.string('Chave PIX inválida')` não exige conteúdo (`SchemaProducerRegister*`,
  `SchemaProducerPublicRegister`); sem PIX não há como pagar a comissão. Decidir se
  deve ser obrigatória.

## Migração para monorepo (pendências)

Ver [`MONOREPO.md`](MONOREPO.md) para o contexto.

- [ ] **Arquivar os 4 repositórios antigos** (`core`, `backend`, `backoffice`, `application`) —
  o monorepo está em `github.com/segwise/monorepo` (push feito).
- [x] CI rodando no GitHub e branch protection (`protect-main`) exigindo o check `CI` (repo público).
- [ ] **Kodus** self-hosted no Dokploy como quality gate (configurar o GitHub App e as regras).
- [ ] **Configurar o CD**: criar o compose no Dokploy (fonte Git, `deploy/docker-compose.yml`,
  Auto Deploy desligado), preencher o Environment, definir `DOKPLOY_URL`, `DOKPLOY_COMPOSE_ID`
  e o segredo `DOKPLOY_API_KEY` no GitHub, cortar os Applications atuais e fazer o primeiro
  deploy à mão — passo a passo em `docs/MONOREPO.md#cicd`.
- [ ] **Reconciliar os schedulers do BullMQ no boot** (`apps/api/src/libraries/marketing/queue.ts`):
  hoje o scheduler `campaign:<id>` só é criado/atualizado ao salvar a campanha; se o Redis da fila
  for perdido, as campanhas ativas param de enviar em silêncio. No boot, chamar
  `syncCampaignSchedule` para cada campanha ativa (o `upsertJobScheduler` é idempotente).
- [ ] **Confirmar backup do Redis da fila** no Dokploy (aba *Backups* do Database Redis ou outra
  estratégia) e **onde configurar os args** `--appendonly yes --maxmemory-policy noeviction`.
- [ ] **CD do mobile** (EAS Build + hot-updater por workflow) e **health check pós-deploy** no CD.
- [ ] **Confirmar no Dokploy** que `NEXT_PUBLIC_ROLE_SYSTEM` do serviço do painel interno é
  `admin` (o compose antigo dizia `backoffice`, que dá 404 nas rotas) e ajustar as
  configurações de build/compose do Dokploy para o contexto na raiz do monorepo.
- [ ] **Testar em dispositivo real o upload de fotos** (`File` do `expo-file-system` +
  `fetch` de `expo/fetch`): nome e `Content-Type` do arquivo chegando no servidor
  (`apps/mobile/src/functions/api/marketplace/vehicles.ts`, `register-update.tsx`).
- [ ] **Validar EAS Build e hot-updater** no monorepo (rodar a partir de `apps/mobile`;
  `eas.json` fixa `bun 1.3.10`, a raiz usa 1.4.2).
- [ ] **Abrir o app** no emulador/simulador (os builds nativos Android/iOS compilam, mas o
  app não foi executado).
- [ ] **Xcode 27**: pods com deployment target antigo (SDWebImage 9.0, RNSVG 12.4) quebram o
  build iOS; hoje só passa forçando `IPHONEOS_DEPLOYMENT_TARGET=16.0`.
- [ ] **Expo**: alinhar `react-native` (0.83.4 → 0.83.10) e `react-native-worklets`
  (0.7.2 → 0.7.4) com `expo install --check`.
- [ ] Apagar `apps/mobile/ios` e `apps/mobile/android` gerados (gitignored, ~4,5 GB) quando
  não forem necessários.

## Outros pontos em aberto (não confirmados, do levantamento inicial do sistema)

Ver [`ARCHITECTURE.md`](ARCHITECTURE.md) — seção de incertezas:

- [ ] Confirmar se `mobile` usa `better-auth` ou outro mecanismo de auth.
- [ ] Confirmar o que exatamente `EXPO_PUBLIC_COMPANY_ID` representa.
- [ ] Localizar/entender o app "xcar" (mencionado via `IOS_XCAR_APP_URL` /
  `ANDROID_XCAR_APP_URL` no `.env.example` do `apps/api`) — não está neste monorepo.

---

Quando um item for resolvido, marcar o checkbox e mover para um changelog
(ou simplesmente remover a entrada) em vez de deixar acumulado aqui.
