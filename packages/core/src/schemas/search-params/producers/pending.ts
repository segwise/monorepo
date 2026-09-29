import z from 'zod';

const SchemaSearchParamsProducerPending = z
	.object({
		kind: z.enum(['all', 'partner', 'producer']).default('all'),
		from: z.iso.date('Data inicial inválida').nullish(),
		to: z.iso.date('Data final inválida').nullish(),
	})
	.strict();

export { SchemaSearchParamsProducerPending };
