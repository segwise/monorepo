import z from 'zod';

const SchemaName = z
	.string('Nome inválido')
	.min(4, 'Nome deve conter ao menos 4 caracteres')
	.trim()
	.toLowerCase();

export { SchemaName };
