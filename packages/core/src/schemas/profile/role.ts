import z from 'zod';

const SchemaRole = z.enum([
	'owner',
	'admin',
	'manager',
	'broker',
	'finance',
	'counter',
	'producer',
	'customer',
]);

export { SchemaRole };
