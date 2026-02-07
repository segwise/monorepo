import z from 'zod';

const SchemaQuoteStatus = z.enum(
	['waiting', 'quoting', 'quoted', 'sent', 'recused', 'confirmed'],
	'Status inválido',
);

export { SchemaQuoteStatus };
