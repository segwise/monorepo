import z from 'zod';

const SchemaResponseDataCursor = z.object({
	data: z.array(z.any(), 'Estrutura de registros inválida'),
	total: z.coerce.number('Total de registro inválido'),
	next: z.uuidv7('ID do próximo registro inválido').nullish(),
	previous: z.uuidv7('ID do registro anterior inválido').nullish(),
	pages: z
		.record(
			z
				.string('Página inválida')
				.or(z.number('Página inválida'))
				.or(z.literal(['first', 'last', 'count'], 'Página inválida')),
			z
				.uuidv7('ID de registro de início da página inválido')
				.or(z.number('Valor da página inválido')),
		)
		.nullish(),
	additional: z
		.record(z.any(), z.any(), 'Estrutura de informações adicionais inválida')
		.nullish(),
});

export { SchemaResponseDataCursor };
