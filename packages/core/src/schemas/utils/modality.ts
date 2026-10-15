import z from 'zod';

const SchemaModality = z.enum(
	[
		'vehicle',
		'motorcycle',
		'truck',
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
