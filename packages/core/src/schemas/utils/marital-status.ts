import z from 'zod';

const SchemaMaritalStatus = z.enum(
	[
		'single',
		'married',
		'divorced',
		'widowed',
		'separated',
		'common_law_marriage',
	],
	'Estado cívil inválido',
);

export { SchemaMaritalStatus };
