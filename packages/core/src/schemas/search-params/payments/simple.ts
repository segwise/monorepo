import z from 'zod';
import { transformArray } from '../../../utils/transform-array';
import {
	SchemaPaymentMethod,
	SchemaPaymentStatus,
	SchemaPaymentType,
} from '../../payments';
import { SchemaDateRange } from '../../utils/date-range';
import { SchemaName } from '../../utils/name';
import { parseJsonQuery } from '../../utils/parse-json-query';

const SchemaSearchParamsPaymentSimple = z
	.object({
		cursor: z.uuidv7('Cursor inválido').nullish(),
		search: SchemaName.nullish(),
		payers: z
			.array(z.uuidv7('ID do pagador inválido'), 'Pagadores inválidos')
			.or(z.uuidv7('ID do pagador inválido'))
			.transform(transformArray)
			.nullish(),
		receivers: z
			.array(z.uuidv7('ID do recebedor inválido'), 'Recebedores inválidos')
			.or(z.uuidv7('ID do recebedor inválido'))
			.transform(transformArray)
			.nullish(),
		limit: z.coerce
			.number('Limite de registros inválido')
			.min(1, 'Limite deve ser maior que 1')
			.max(100, 'Limite de registros não pode ser maior de 100')
			.default(10),
		status: z
			.array(SchemaPaymentStatus, 'Status inválido')
			.or(SchemaPaymentStatus)
			.transform(transformArray)
			.nullish(),
		expiration: SchemaDateRange.or(parseJsonQuery(SchemaDateRange)).nullish(),
		paidAt: SchemaDateRange.or(parseJsonQuery(SchemaDateRange)).nullish(),
		type: z
			.array(SchemaPaymentType, 'Tipo inválido')
			.or(SchemaPaymentType)
			.transform(transformArray)
			.nullish(),
		method: z
			.array(SchemaPaymentMethod, 'Método de pagamento inválido')
			.or(SchemaPaymentMethod)
			.transform(transformArray)
			.nullish(),
		amount: z.coerce
			.number('Valor do pagamento inválido')
			.min(0, 'Valor do pagamento inválido')
			.or(
				parseJsonQuery(
					z.tuple([
						z.coerce.number('Valor mínimo do pagamento inválido').min(0),
						z.coerce.number('Valor máximo do pagamento inválido'),
					]),
				),
			)
			.nullish(),
	})
	.strict();

export { SchemaSearchParamsPaymentSimple };
