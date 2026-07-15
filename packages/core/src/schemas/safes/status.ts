import z from 'zod';

const SchemaSafeStatus = z.enum(
	['canceled', 'suspended', 'active'],
	'Status inválido',
);

export { SchemaSafeStatus };
