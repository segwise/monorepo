import z from 'zod';

import { SchemaName } from '../../utils/name';

const SchemaSearchParamsInsuranceCompanySimple = z
	.object({
		cursor: z.uuidv7('Cursor inválido').nullish(),
		search: SchemaName.nullish(),
		limit: z.coerce
			.number('Limite de registros inválido')
			.min(1, 'Limite deve ser maior que 1')
			.max(100, 'Limite de registros não pode ser maior de 100')
			.default(10),
	})
	.strict();

export { SchemaSearchParamsInsuranceCompanySimple };
