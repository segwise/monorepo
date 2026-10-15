# Dashboard (`/dashboard` do portal customer)

Todos os cards leem de `GET /services/analytics/dashboard/*` (backend em
`src/routers/services/analytics/dashboard/`, regras em
`src/libraries/dashboard/`). Hooks no backoffice: `libraries/hooks/analytics/`.
O filtro de período (`period-filter.tsx`) manda `from/to` e `refFrom/refTo`
(período de comparação); dias são calculados no fuso do usuário (`X-timezone`).

## Definições

- **Proposta (produção)**: tudo é proposta — o seguro vale desde o cadastro;
  apólice só existe se cadastrada como tal ou confirmada manualmente
  (`effectivedAt`) e não muda nenhuma métrica.
  Conta por `requestedAt` (início da vigência, gravado 00:00 UTC, então a data é
  UTC e não do fuso do usuário). Entram todos, exceto os que perderam a vigência
  por cancelamento **antes** do fim dela (`status = canceled` e
  `statusAt < expiration`). O sistema marca como `canceled` também o seguro que só
  terminou a vigência (`statusAt >= expiration`; ~98% dos "cancelados"), e esses
  continuam contando no período em que foram vendidos. Também ficam de fora
  `isExternal` e o produtor de teste (`EXCLUDED_PRODUCER_ID`, mesmo id ignorado na listagem, em
  `safes/build-safe-simple-where.ts`).
- **Prêmio líquido**: soma de `Safe.award` das propostas.
- **Comissão gerada**: soma de `Safe.commissionGross` (comissão bruta da corretora).
- **Propostas canceladas**: `Safe.canceledAt` preenchido (e `status = canceled`).
  `canceledAt` é a data em que o seguro perdeu a vigência por cancelamento; fica
  nulo quando a vigência apenas terminou (o sistema também grava `canceled` nesse
  caso, então `status` sozinho não diferencia). É gravado por
  `endorsements/cancel.ts` (data do endosso, junto com `statusMessage` = "Cancelado
  por endosso") e pela importação do sistema antigo (só se desativado antes do
  fim). A migration `20260930010000_add_safe_canceled_at` cria a coluna e
  preenche os 70 existentes (19 por endosso + 51 migrados). O card mostra
  quantidade, prêmio líquido perdido, comparação com o período de referência
  (subir é ruim) e os 8 mais recentes.
- **Cotações**: `Quote` com `requestedAt` no período.
- **Taxa de conversão**: cotações `confirmed` ÷ cotações do período.
- **Ticket médio**: prêmio líquido ÷ propostas.
- **Tempo de fechamento**: média de `statusAt − requestedAt` das cotações
  confirmadas do período (dias).
- **Comissão prevista**: soma de `Payment` (seguradora → corretora, não
  cancelado) com vencimento no período.
- **Resumo financeiro** (posição de hoje, sem filtro de período): a receber e a
  pagar nos próximos 30 dias, comissões pendentes das seguradoras e
  recebimentos em atraso (`Payment` `waiting`).
- **Funil**: cotações solicitadas → respondidas (`quoted|sent|confirmed`) →
  confirmadas → apólices emitidas. Não há "Leads" no banco.
- **Ação necessária**: cotações paradas (waiting/quoting há 2–90 dias), cotações
  sem resposta do cliente (`sent` há 3–90 dias), apólices vencendo em 30 dias sem
  renovação, recebimentos em atraso. Cotações com mais de 90 dias são tratadas
  como abandonadas. Não há módulo de sinistros.
- **Projeção anual**: próximos 12 meses = últimos 12 meses (calendário, com o mês
  atual) × crescimento sobre os 12 meses anteriores, limitado a ±30%. Cada mês é
  limitado a 0,5×–1,5× a mediana antes de somar (um mês atípico não distorce).
- **Projeção do próximo período**: mediana dos últimos 6 meses fechados,
  proporcional aos dias do período selecionado.

## Performance (regras e medições)

- Somas e médias são feitas **no banco** (`groupBy`/`aggregate`/`GROUP BY`),
  nunca trazendo as linhas para somar em JS: `metricSeries` agrupa por dia,
  `operational-kpis` calcula o tempo de fechamento com `avg()` e `canceled`
  só busca as linhas completas dos itens exibidos (`take: limit`).
- Índices que sustentam o dashboard (migrations `20261007100*`): `safes
  (broker_id, requested_at)` e `(broker_id, status, expiration)`, `quotes
  (broker_id, requested_at)` e `(broker_id, status, status_at)`, `payments
  (receiver_id, status, expiration)` e `(payer_id, status, expiration)`. Filtro
  novo no dashboard = conferir o índice (ver `CONVENTIONS.md`).
- Medição local (1M seguros, 500 mil cotações, 300 mil pagamentos, uma
  corretora): soma das 11 consultas do dashboard 7,1 s → 1,5 s só com a mudança
  de código → 1,1 s com os índices; `metric` anual 1,6–1,9 s → ~0,1 s,
  `yearly-projection` 2,0 s → 0,09 s. Resultados idênticos ao código antigo.
- Ponto ainda pesado: `producers-ranking` (agrupa por produtor; ~0,4 s com 1M
  de seguros e produtores todos distintos, caso extremo).

## Pendências conhecidas

- Sem tela nem análise de apólices: `/policies` redireciona para `/proposals` e as
  rotas `analytics/policies` foram removidas. `Safe.effectivedAt` continua no banco
  (dados migrados). Falta decidir a "confirmação manual" de apólice.
- Sobras com o termo apólice: `/insureds` (mock, "N apólices"), PDF da cotação
  (`quotes/[id]/print.ts`, rótulo `APÓLICE:`), textos legais do app
  (`required-reading.tsx`), e-mail de convite de parceiro e o parâmetro
  `effectived` em `core/schemas/search-params/safes/simple.ts` (não é mais enviado).

- `analytics/policies/count.ts` e `status.ts` repetem a chave `OR` no mesmo
  objeto: a última sobrescreve as anteriores, então o filtro de `isExternal`
  some quando não há filtro de produtor. Os números do dashboard usam `AND`
  explícito e podem divergir do `CardOverview` por isso.
- `/performance` (Relatórios) ainda usa cards de exemplo
  (`active-brokers`, `leads-captured`, `pending-quotes`, `active-insurance`,
  `insurance-analysis-and-quotes`); `/insureds` também usa `faker`.
