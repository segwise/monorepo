import z from 'zod';

import { SchemaName } from '../../utils/name';

const SchemaSearchParamsProducerSimple = z
	.object({
		cursor: z.uuidv7('Cursor inválido').nullish(),
		search: SchemaName.nullish(),
		limit: z.coerce
			.number('Limite de registros inválido')
			.min(1, 'Limite deve ser maior que 1')
			.max(100, 'Limite de registros não pode ser maior de 100')
			.default(10),
		kind: z.enum(['all', 'partner', 'producer']).nullish(),
		// Listagem única: membros (ativos/suspensos) e convites pendentes.
		status: z.enum(['all', 'active', 'suspended', 'pending']).nullish(),
		from: z.iso.date('Data inicial inválida').nullish(),
		to: z.iso.date('Data final inválida').nullish(),
	})
	.strict();

export { SchemaSearchParamsProducerSimple };
