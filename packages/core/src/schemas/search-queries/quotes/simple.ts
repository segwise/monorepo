import z from 'zod';
import { SchemaQuoteStatus } from '@/schemas/quotes/status';
import { SchemaQuoteType } from '@/schemas/quotes/type';
import { SchemaName } from '@/schemas/utils/name';

const SchemaSearchQueriesQuoteSimple = z.object({
	producer: z
		.array(z.uuidv7('ID do produtor inválido'), 'Produtores inválidos')
		.nullish(),
	name: SchemaName,
	insuranceCompanies: z
		.array(z.uuidv7('ID da seguradora inválido'), 'Seguradoras inválidas')
		.transform((props) => (Array.isArray(props) ? props : [props])),
	limit: z.coerce
		.number('Limite de registros inválido')
		.min(1, 'Limite deve ser maior que 1')
		.max(100, 'Limite de registros não pode ser maior de 100'),
	type: SchemaQuoteType,
	status: SchemaQuoteStatus,
	requestAt: z.coerce.date('Data de solicitação inválido'),
});

export { SchemaSearchQueriesQuoteSimple };
