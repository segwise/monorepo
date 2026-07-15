import z from 'zod';

import { SchemaQuoteStatus } from '../../quotes/status';
import { SchemaQuoteType } from '../../quotes/type';
import { SchemaName } from '../../utils/name';

const SchemaSearchQueriesQuoteSimple = z.object({
	producer: z
		.array(z.uuidv7('ID do produtor inválido'), 'Produtores inválidos')
		.nullish(),
	name: SchemaName.nullish(),
	insuranceCompanies: z
		.array(z.uuidv7('ID da seguradora inválido'), 'Seguradoras inválidas')
		.transform((props) => (Array.isArray(props) ? props : [props]))
		.nullish(),
	limit: z.coerce
		.number('Limite de registros inválido')
		.min(1, 'Limite deve ser maior que 1')
		.max(100, 'Limite de registros não pode ser maior de 100')
		.nullable()
		.default(10),
	type: SchemaQuoteType.nullish(),
	status: SchemaQuoteStatus.nullish(),
	requestAt: z.coerce
		.date('Data de solicitação inválido')
		.or(z.iso.datetime('Data de solicitação inválida'))
		.nullish(),
});

export { SchemaSearchQueriesQuoteSimple };
