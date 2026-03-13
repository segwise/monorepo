import z from 'zod';

const SchemaQualificationTime = z.coerce
	.number('Tempo de habilitação inválida')
	.min(0, 'Tempo de habilitação inválida')
	.max(9, 'Tempo de habilitação inválida')
	.or(z.literal(99, 'Tempo de habilitação inválida'));

export { SchemaQualificationTime };
