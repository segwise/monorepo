# Endossos — registro e reversão

Endossos alteram a proposta (`Safe`) e são registrados em `Endorsement`. Tipos
(`EndorsementType`): `vehicle_driver` (placa/veículo e/ou principal condutor),
`address` (CEP de pernoite), `franchise` e `cancellation`. Rotas em
`backend/src/routers/services/endorsements/` (`/endorsements/:safeId/...`).

## Reversão

Botão **Reverter** na lista de endossos da proposta (`Propostas → ⋮ → Endossos`,
`containers/dialogs/safes/endorsement-item.tsx`).

### Regras (valem no servidor, `functions/endorsements/snapshot.ts` → `getRevertStatus`)

1. **Só até 24h depois do registro** (`Endorsement.createdAt`, gravado explicitamente
   na criação).
2. **Só o endosso mais recente ainda não revertido da proposta** (do mais novo para o
   mais antigo). Depois de reverter o último, o anterior passa a poder ser revertido
   (se ainda estiver nas 24h). Os revertidos não contam.
3. **Nunca um já revertido.**
4. **Só com os dados anteriores guardados.** Endossos criados antes do recurso não
   têm snapshot e não podem ser revertidos (`no_snapshot`).
5. **Só se a proposta continua como o endosso a deixou.** Se alguém editou os campos
   depois, a reversão é recusada (409) para não apagar a edição.
6. Exige sessão na corretora dona da proposta e perfil que não seja produtor.

O endosso **continua na lista**, marcado como revertido (`revertedAt`, `revertedById`),
com as alterações riscadas e a data da reversão.

### Dados guardados

`Endorsement.snapshot = { before, after }` com **só os campos que aquele tipo altera**,
capturados na mesma transação do registro (`captureEndorsementState`; mapa `TOUCHED`):

| Tipo | Campos |
|---|---|
| `address` | CEP de pernoite |
| `franchise` | franquia |
| `cancellation` | status, data/mensagem do status, data do cancelamento |
| `vehicle_driver` | franquia, placa, vínculo de veículo (`vehicleId`/`vehicleWithoutPlateId`), CPF, nome, nascimento e idade do condutor |

Valores são JSON puro (decimal como texto com 2 casas, datas ISO). Na reversão, o
veículo sem placa criado pelo endosso é apagado se nada mais o usa.

### Concorrência

A reversão trava a linha da proposta (`SELECT ... FOR UPDATE`) e "reivindica" o endosso
com `updateMany(... revertedAt: null)`: duas reversões simultâneas → uma 200 e uma 409.

### Listagem

`GET /endorsements/:safeId` devolve, por endosso, `revertedAt` e
`revert: { canRevert, reason, until, changes }` (`reason`: `reverted | expired |
not_latest | no_snapshot`; `changes`: campo, valor antes do endosso e valor atual). A
lista no painel é ordenada por `createdAt` desc — a ordem da regra.

### Ao adicionar um campo novo a um endosso

Inclua-o em `TOUCHED` (e em `DISPLAY`, se for exibível) e trate-o em `restore`
(`revert.ts`); senão ele não será revertido.

## Pendência conhecida

As rotas de **registro** de endosso (`POST /endorsements/:id/...`) não exigem sessão nem
conferem a corretora (só a reversão confere). Vale proteger.
