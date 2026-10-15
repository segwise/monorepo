# Módulo Marketing

Menu "Marketing" no sidebar do portal `customer`. Primeira feature: **Campanhas**
(e-mails recorrentes de convite de parceria).

## Campanhas — como funciona

- **Campanha** = modelo de e-mail + assunto + botão de WhatsApp + agendamento
  (todo dia, ou todo mês em um dia de 1 a 28, sempre num horário fixo, fuso
  America/Sao_Paulo) + lista de contatos própria.
- **Contato** = nome, e-mail e celular (opcional). Pertence a uma campanha
  (mesmo e-mail pode estar em campanhas diferentes).
- **Modelos** ficam no código: `apps/api/src/templates/partnership-invite/*`
  (React Email), registrados em `apps/api/src/libraries/marketing/templates.ts`.
  Modelo novo = componente novo + valor em `enum MarketingTemplate`
  (`schema.prisma`) + `MarketingTemplate` em `core/schemas/marketing` + entrada
  no registro. Hoje: contabilidade e administradora de condomínio.
- **Botão WhatsApp**: link `wa.me/<número>?text=<mensagem>` da campanha, passado
  ao template como `whatsappUrl`.

## Agendamento (BullMQ)

- Fila `marketing` em um Redis próprio (`QUEUE_URL`: Database Redis do Dokploy, **fora** do
  `deploy/docker-compose.yml`), separado do cache (`CACHE_URL`): a fila roda com AOF e
  `maxmemory-policy noeviction` para nunca perder jobs por falta de memória.
  **Reconciliação no boot** (`libraries/marketing/reconcile.ts`, chamada em `src/index.ts`): a cada
  subida da api o Redis da fila é refeito a partir do banco — campanha ativa ganha/atualiza o
  scheduler, campanha pausada perde o dela, e scheduler `campaign:*` sem campanha no banco
  (órfão: campanha apagada, inclusive por cascata ao excluir a corretora, ou backup antigo do
  Redis restaurado) é removido. Assim perder ou restaurar o Redis não deixa campanha sem envio
  nem dispara campanha apagada. Schedulers que não começam com `campaign:` não são tocados.
- Cada campanha ativa tem um *job scheduler* `campaign:<id>` (cron). O ID do scheduler no BullMQ é
  o `key` (o `id` volta vazio em `getJobSchedulers()`); `removeJobScheduler` aceita esse `key` e
  devolve `false`, sem erro, se ele não existir. Criar,
  editar, pausar ou excluir a campanha sincroniza o scheduler
  (`libraries/marketing/queue.ts`).
- O worker roda no mesmo processo do backend (`libraries/marketing/worker.ts`,
  importado em `src/index.ts`). Envia um e-mail por contato pelo Resend e grava
  um `MarketingDelivery` com o id do e-mail.
- "Enviar agora" enfileira um job avulso (`manual: true`, funciona mesmo com a
  campanha pausada).
- Painel Bull Board: `GET /services/marketing/queues` (só owner/admin da
  corretora). Botão "Fila de envios" na tela de campanhas.

## Aberturas e cliques (webhook do Resend)

- `POST /services/webhooks/resend` (público, valida a assinatura svix).
- Eventos tratados: `email.delivered|bounced|complained|failed|opened|clicked`;
  atualiza o `MarketingDelivery` pelo `email_id`.
- **Configuração necessária**:
  1. No Resend: ativar *open tracking* e *click tracking* no domínio de envio.
  2. No Resend: criar o webhook apontando para a URL acima com os eventos
     acima.
  3. Colocar o *signing secret* em `RESEND_WEBHOOK_SECRET` (backend). Sem ele o
     webhook responde 503.
- Tela de contatos: quem clicou aparece primeiro, depois quem abriu; botão de
  ligar (`tel:`) quando há celular.

## Contatos: cidade/UF e impressão

- Contato tem `city` e `state` (UF), obrigatórios no cadastro; contatos antigos
  ficam sem. O dialog de cadastro sempre abre vazio, exceto cidade/UF, que vêm do
  último contato cadastrado na campanha (calculado pela lista, sem storage local).
- Cadastro: escolhe o **estado** primeiro e a **cidade** é um Combobox com busca
  populado por `GET /services/utils/cities?uf=PE`. O backend consulta o IBGE
  (`servicodados.ibge.gov.br`, municípios por UF) uma única vez por estado e guarda
  no Redis do cache (`ibge:cities:<UF>`, 30 dias); pedidos simultâneos do mesmo
  estado compartilham uma chamada só. A resposta também leva
  `Cache-Control: private, max-age=86400` e o hook `use-cities.ts` mantém em
  memória na sessão. Estados não precisam de API: vêm da lista fixa
  `BRAZILIAN_STATES` no `core`. Se a rota falhar, a cidade vira campo de texto.
- Filtro (Sheet): estado e cidade, só com os que existem nos contatos da
  campanha; a cidade depende do estado. O filtro vai no cabeçalho da impressão
  ("Estado: PE · Cidade: Recife").
- "Imprimir" na tela de contatos manda os ids do que está filtrado para
  `POST /marketing/campaigns/:id/contacts/print` e recebe um PDF (sem limite de
  linhas) só com nome, e-mail e celular, mais colunas em branco "Responsável" e
  "Cel. responsável" e um quadrado de conferência manual. A ordem é a da tela.

## Deploy

1. Migrations (`MarketingCampaign`, `MarketingContact`, `MarketingDelivery`
   e enums; depois `..._add_marketing_contact_location` para cidade/UF) — rodar primeiro no banco de dev, depois no deploy.
2. `RESEND_WEBHOOK_SECRET` no ambiente do backend.
3. Campanhas nascem **pausadas**; ativar só depois de conferir a lista.

## Substitui

`apps/api/src/routers/services/emails.ts` (`/send-email/*`, disparo manual com
contatos fixos no código). Pode ser removido depois de importar aquelas listas
para campanhas.

## Ideias para o módulo (a definir)

- [ ] Importar contatos por CSV/planilha.
- [ ] Link de descadastro + lista de supressão (LGPD).
- [ ] Editar textos do e-mail pela tela (hoje só assunto e WhatsApp).
- [ ] Segmentar por produtor/parceiro já cadastrado (usar a base de Produtores
      como origem da lista).
- [ ] Régua de follow-up: reenviar só para quem abriu e não clicou.
- [ ] Relatório por campanha (taxa de entrega, abertura, clique ao longo do
      tempo).
- [ ] WhatsApp como canal (além do e-mail) para lembretes de renovação.
- [ ] Campanhas para segurados (renovação de apólice, aniversário).
