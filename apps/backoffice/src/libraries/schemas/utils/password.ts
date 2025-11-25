import z from 'zod';

const SchemaPassword = z
	.string('Senha inválida')
	.min(6, 'Mínimo 6 caracteres')
	.max(12, 'Máximo 12 caracteres');

export { SchemaPassword };
