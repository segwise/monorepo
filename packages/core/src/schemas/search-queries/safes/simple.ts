import z from 'zod';

import { SchemaName } from '../../utils/name';

const SchemaSearchQueriesSafeSimple = z.object({
	producer: z
		.uuidv7('ID do produtor inválido')
		.or(
			z
				.array(z.uuidv7('ID do produtor inválido'), 'Produtores inválidos')
				.min(1, 'Produtores inválidos'),
		)
		.transform((props) => (Array.isArray(props) ? props : [props]))
		.nullish(),
	name: SchemaName.nullish(),
	insuranceCompanies: z
		.uuidv7('ID da seguradora inválido')
		.or(
			z
				.array(z.uuidv7('ID da seguradora inválido'), 'Seguradoras inválidas')
				.min(1, 'Seguradoras inválidas'),
		)
		.transform((props) => (Array.isArray(props) ? props : [props]))
		.nullish(),
	limit: z.coerce
		.number('Limite de registros inválido')
		.min(1, 'Limite deve ser maior que 1')
		.max(100, 'Limite de registros não pode ser maior de 100')
		.nullable()
		.default(10),
	ids: z
		.uuidv7('ID do seguro inválido')
		.or(
			z.array(
				z.uuidv7('ID do seguro inválido').min(1, 'IDs inválidos'),
				'IDs inválidos',
			),
		)
		.transform((props) => (Array.isArray(props) ? props : [props]))
		.nullish(),
});

export { SchemaSearchQueriesSafeSimple };
