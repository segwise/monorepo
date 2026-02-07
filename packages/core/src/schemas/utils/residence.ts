import z from 'zod';

const SchemaResidence = z.enum(
	['home', 'apartment', 'house_condominium', 'others'],
	'Tipo inválido',
);

export { SchemaResidence };
