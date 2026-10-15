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
  Arquivo: `backoffice/src/containers/dialogs/producers/register.tsx`
  (chamado a partir de `backoffice/src/containers/tables/producers/simple.tsx`).

- [ ] **Dropdown de ações ("...") na tabela está vazio.**
  `<DropdownMenuContent align='end' />` sem nenhum `DropdownMenuItem` —
  botão existe mas não faz nada. Definir quais ações fazem sentido aqui
  (editar, desativar, reenviar convite, etc.) antes de implementar.
  Arquivo: `backoffice/src/containers/tables/producers/simple.tsx`.

- [ ] **Status "Ativo" fixo/hardcoded na tabela**, não reflete o estado real
  do produtor. Hoje o fluxo é: `POST /producers` cria um `User` + um
  `Invitation` (não cria o `Member` diretamente) — um convite pendente
  (ainda não aceito) provavelmente deveria aparecer como "Pendente", não
  "Ativo". Verificar se há como diferenciar `Member` (aceito) de
  `Invitation` (pendente) na resposta de `/producers/simple` e refletir
  isso na UI.
  Arquivos: `backoffice/src/containers/tables/producers/simple.tsx`,
  `backend/src/routers/services/producers/listinig.ts`.

- [ ] **Select "Tipo de Pagamento" só oferece a opção "Mensal"** — as
  opções semanal (`weekly`) e quinzenal (`bi_weekly`) de
  `SchemaProducerTypeOfPayment` estão comentadas no JSX. Confirmar se é
  intencional (regra de negócio) ou só um corte temporário, e reabilitar se
  fizer sentido.
  Arquivo: `backoffice/src/containers/dialogs/producers/register.tsx`
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

## Outros pontos em aberto (não confirmados, do levantamento inicial do sistema)

Ver [`ARCHITECTURE.md`](ARCHITECTURE.md) — seção de incertezas:

- [ ] Confirmar se `application` usa `better-auth` ou outro mecanismo de auth.
- [ ] Confirmar o que exatamente `EXPO_PUBLIC_COMPANY_ID` representa.
- [ ] Localizar/entender o app "xcar" (mencionado via `IOS_XCAR_APP_URL` /
  `ANDROID_XCAR_APP_URL` no `.env.example` do backend) — não está entre os
  4 diretórios deste workspace.

---

Quando um item for resolvido, marcar o checkbox e mover para um changelog
(ou simplesmente remover a entrada) em vez de deixar acumulado aqui.
