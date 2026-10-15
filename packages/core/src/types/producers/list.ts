import type { ProducerPending } from './pending';
import type { ProducerSimple } from './simple';

// Linha da listagem única de produtores/parceiros: quem já é membro da
// corretora (`active`, com `status` ativo ou suspenso) ou ainda tem convite
// pendente (`pending`, id = id do convite).
type ProducerListItem =
	| (ProducerSimple & { origin: 'active' })
	| (ProducerPending & { origin: 'pending' });

export type { ProducerListItem };
