import z from 'zod';

const SchemaProfessionSimple = z.object({
	code: z
		.string('Código da profissão inválida')
		.min(1, 'Código da profissão inválida'),
	name: z
		.string('Nome da profissão inválida')
		.min(1, 'Nome da profissão inválida'),
});

export { SchemaProfessionSimple };
