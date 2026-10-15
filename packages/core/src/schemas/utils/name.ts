import z from 'zod';

const SchemaName = z
	.string('Nome inválido')
	.min(3, 'Nome deve conter ao menos 3 caracteres')
	.trim()
	.toLowerCase();

export { SchemaName };
