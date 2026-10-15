import z from 'zod';

const SchemaQualificationTime = z.coerce
	.number('Tempo de habilitação inválida')
	.min(0, 'Tempo de habilitação inválida')
	.max(10, 'Tempo de habilitação inválida');

export { SchemaQualificationTime };
