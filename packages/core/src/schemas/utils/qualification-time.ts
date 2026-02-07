import z from 'zod';

const SchemaQualificationTime = z.coerce
	.number('Tempo de habilitação inválida')
	.positive('Necessário ter ao menos 1 ano de habilitação')
	.pipe(z.literal([1, 2, 3, 4, 5, 6, 7, 8, 9, 99]));

export { SchemaQualificationTime };
