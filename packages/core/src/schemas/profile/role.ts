import z from 'zod';

const SchemaRole = z.enum([
	'owner',
	'admin',
	'user',
	'broker',
	'producer',
	'finance',
	'counter',
]);

export { SchemaRole };
