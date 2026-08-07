import { z } from 'zod';
import { getNumericValue } from '../../utils';

const SchemaEndorsementFranchise = z.object({
	franchise: z
		.string('Frânquia inválido')
		.transform(getNumericValue)
		.or(z.coerce.number('Frânquia inválido').min(0, 'Frânquia inválido')),
	amount: z
		.string('Valor inválido')
		.transform(getNumericValue)
		.or(z.coerce.number('Frânquia inválido').min(1, 'Frânquia inválido'))
		.refine((value) => value > 0, 'Frânquia inválido'),
	percentage: z
		.string('Percentual inválido')
		.transform(getNumericValue)
		.or(z.coerce.number('Percentual inválidas')),
	commission: z
		.string('Comissão inválida')
		.transform(getNumericValue)
		.or(z.coerce.number('Comissão inválida').min(0, 'Comissão inválida')),
});

export { SchemaEndorsementFranchise };
