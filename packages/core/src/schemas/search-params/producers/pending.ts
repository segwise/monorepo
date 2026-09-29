import z from 'zod';

const SchemaSearchParamsProducerPending = z
	.object({
		kind: z.enum(['all', 'partner', 'producer']).default('all'),
	})
	.strict();

export { SchemaSearchParamsProducerPending };
