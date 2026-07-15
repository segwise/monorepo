import z from 'zod';
import { defaultFilterDate } from '../../../utils/default-filter-date';
import { transformArray } from '../../../utils/transform-array';
import { SchemaSafeStatus } from '../../safes';
import { SchemaModality } from '../../utils';
import { SchemaDateRange } from '../../utils/date-range';
import { SchemaName } from '../../utils/name';
import { parseJsonQuery } from '../../utils/parse-json-query';

const SchemaSearchParamsSafeSimple = z
	.object({
		cursor: z.uuidv7('Cursor inválido').nullish(),
		search: SchemaName.nullish(),
		producers: z
			.array(z.uuidv7('ID do produtor inválido'), 'Produtores inválidos')
			.or(z.uuidv7('ID do produtor inválido'))
			.transform(transformArray)
			.nullish(),
		brokers: z
			.array(z.uuidv7('ID da corretora inválida'), 'Corretoras inválidos')
			.or(z.uuidv7('ID da corretora inválida'))
			.transform(transformArray)
			.nullish(),
		insuranceCompanies: z
			.array(z.uuidv7('ID da seguradora inválido'), 'Seguradoras inválidas')
			.or(z.uuidv7('ID da seguradora inválido'))
			.transform(transformArray)
			.nullish(),
		limit: z.coerce
			.number('Limite de registros inválido')
			.min(1, 'Limite deve ser maior que 1')
			.max(100, 'Limite de registros não pode ser maior de 100')
			.default(10),
		renewal: z
			.boolean('Seletor de renovação inválido')
			.or(z.literal(['true', 'false']).transform((value) => value === 'true'))
			.nullish(),
		modality: z
			.array(SchemaModality, 'Tipo inválido')
			.or(SchemaModality)
			.transform(transformArray)
			.nullish(),
		status: z
			.array(SchemaSafeStatus, 'Status inválido')
			.or(SchemaSafeStatus)
			.transform(transformArray)
			.nullish(),
		effectivedAt: SchemaDateRange.or(parseJsonQuery(SchemaDateRange)).default(
			defaultFilterDate,
		),
		effectived: z
			.boolean('Seletor de efetivação inválido')
			.or(z.literal(['true', 'false']).transform((value) => value === 'true'))
			.nullish(),
		ids: z
			.uuidv7('ID do seguro inválido')
			.or(
				z.array(
					z.uuidv7('ID do seguro inválido').min(1, 'IDs inválidos'),
					'IDs inválidos',
				),
			)
			.transform(transformArray)
			.nullish(),
	})
	.strict();

export { SchemaSearchParamsSafeSimple };
