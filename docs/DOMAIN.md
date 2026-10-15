# Glossário de domínio — seguros automotivos

Baseado nos models do Prisma (`packages/database/prisma/schema.prisma`) e nos schemas/
tipos/traduções do `core` (`packages/core/src/{schemas,types,translate}`). Os nomes em
português são as traduções exibidas na UI (`packages/core/src/translate`); os nomes em
inglês são os usados no código (models, tipos, rotas).

| Termo no código | Significado |
|---|---|
| **Quote** | Cotação de seguro — antes de virar proposta. |
| **Safe** | **Proposta de seguro** (nome do model no Prisma). No sistema tudo é proposta: ela já vale desde o cadastro, até a seguradora recusar/cancelar (perde a vigência). Só existe "apólice" se ela for cadastrada como tal ou confirmada manualmente (`effectivedAt` preenchido), e mesmo assim é o mesmo registro e conta como qualquer proposta nas métricas. `requestedAt` = início da vigência; `expiration` = fim. `status = canceled` também é gravado quando a vigência apenas termina, então não significa cancelamento por si só: cancelamento real é `canceledAt` preenchido. Status: `active`, `suspended`, `canceled`. Tipos de comissão: `by_the_brokerage_commission` (pela comissão da corretora), `by_the_net_premium` (pelo prêmio líquido), `fixed_value` (valor fixo). |
| **Endorsement** | Endosso — alteração formal em uma apólice já ativa (troca de dados, veículo, etc). |
| **Vehicle / VehicleWithoutPlate / QuoteVehicle / SafeVehicle** | Veículo genérico, veículo sem placa ainda definida (0km/consulta), veículo associado a uma cotação, veículo associado a uma apólice. |
| **ManufacturerVehicle** | Dados de fábrica do veículo (provavelmente ligado a tabela FIPE). |
| **Insured / TemporaryInsured** | Segurado — pessoa coberta pela apólice. "Temporary" é provavelmente um cadastro pré-conversão/lead. |
| **Broker** | Corretora. |
| **Producer** | Produtor/corretor individual — vendedor ligado a uma `Broker`. Tem seu próprio portal no `backoffice` (role `producer`). |
| **Member / Invitation** | Membro de equipe e convite pendente (dentro de uma `Broker`, provavelmente). |
| **InsuranceCompany / InsuranceCompanyContact / InsuranceCompanyCategoryContact** | Seguradora parceira (ex.: Allianz, citada em templates de e-mail) e seus contatos por categoria. |
| **Payment / PaymentPayerAndReceiver** | Pagamento e o relacionamento pagador/recebedor — sustenta split de pagamento via Transfeera/Pix. |
| **QuoteFinancingAVehicle** | Financiamento de veículo atrelado a uma cotação. |
| **MarketplaceVehicle** | Veículo listado no marketplace (compra/venda, feature também presente no app mobile: `(buying-and-selling)`). |
| **User / Session / Account / Verification** | Models de autenticação do `better-auth`, não de domínio de negócio. |

## Papéis de usuário (roles)

Refletidos em `apps/backoffice/src/app/{admin,customer,producer}` e nos três
serviços do `deploy/docker-compose.yml` (`backoffice`, `customer`, `producer`):

- **admin** — equipe interna Segwise, acesso amplo.
- **customer** — segurado/cliente final (também atendido pelo app `mobile`).
- **producer** — produtor/corretor que vende e gerencia apólices dos seus clientes.

## Áreas de negócio no app mobile

Grupos de rotas em `src/app/(stacks)/`:
- `(buying-and-selling)` — compra e venda de veículos (marketplace).
- `(insurances)` — seguros contratados.
- `(request-quote)` — solicitar cotação.
- `(required-reading)` — leitura obrigatória (termos, avisos).
- `(useful-contacts)` — contatos úteis.
- `(vehicle-inquiry)` — consulta de veículo.
- `(what-to-do)` — o que fazer (provavelmente em caso de sinistro).

## Convenção de nomenclatura a manter

Ao criar novo código relacionado a domínio, siga os nomes já estabelecidos
acima (`Safe` para apólice, não "Policy"; `Producer` para corretor individual,
não "Broker" — `Broker` é a corretora/empresa). Inconsistência aqui quebra o
alinhamento com o `core`, que é a fonte de verdade dos tipos.

## Produtor/parceiro que ainda não confirmou o e-mail

O usuário é criado já no cadastro; o `Member` só nasce no aceite do convite (quando
confirma o e-mail e define a senha). Enquanto isso o login continua bloqueado, mas ele
**já recebe cotações e propostas**: o código de indicação (`resolveProducerByReferral`,
`apps/api/src/functions/producers/`) resolve também pelo convite pendente, e o seletor
`GET /producers/simple/full` lista quem tem convite pendente. Cotações e propostas
guardam `producerId` = id do usuário, então nada muda no aceite.

