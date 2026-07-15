import z from 'zod';

const SchemaModality = z.enum(
	[
		'vehicle',
		'health',
		'residence',
		'business',
		'condominium',
		'travel',
		'professional',
		'construction',
	],
	'Tipo inválido',
);

export { SchemaModality };
