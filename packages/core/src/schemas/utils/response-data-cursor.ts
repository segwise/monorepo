import z from 'zod';

const SchemaResponseDataCursor = z.object({
	data: z.array(z.any(), 'Estrutura de registros inválida'),
	next: z.uuidv7('ID do próximo registro inválido').nullish(),
	previous: z.uuidv7('ID do registro anterior inválido').nullish(),
	pages: z.record(
		z.coerce
			.number('Número da página inválido')
			.min(1, 'Número da página deve ser maior ou igual a 1')
			.max(10, 'Número da página deve ser menor que 10'),
		z.uuidv7('ID de registro de início da página inválido'),
	),
	additional: z
		.record(z.any(), z.any(), 'Estrutura de informações adicionais inválida')
		.nullish(),
});

export { SchemaResponseDataCursor };
