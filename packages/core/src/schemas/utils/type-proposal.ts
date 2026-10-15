import z from 'zod';

const SchemaTypeProposal = z.enum([
	'health',
	'residence',
	'business',
	'condominium',
	'travel',
	'professional',
	'construction',
]);

export { SchemaTypeProposal };
