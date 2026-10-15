import z from 'zod';

const SchemaSearchParamsMarketplaceSimple = z
	.object({
		cursor: z.uuidv7('Cursor inválido').nullish(),
		search: z.string('Consulta inválido').nullish(),
		limit: z.coerce
			.number('Limite de registros inválido')
			.min(1, 'Limite deve ser maior que 1')
			.max(100, 'Limite de registros não pode ser maior de 100')
			.default(10),
		orderBy: z.enum(['price', 'date']).nullish(),
		state: z.string('Estado inválido').toLowerCase().nullish(),
		city: z.string('Cidade inválida').toLowerCase().nullish(),
		neighborhood: z.string('Bairro inválido').nullish(),
	})
	.strict();

export { SchemaSearchParamsMarketplaceSimple };
