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
		.refine((val) => val >= 1 && val <= 100, {
			message: 'Percentual inválido',
		})
		.or(
			z.coerce
				.number('Percentual inválidas')
				.min(1, 'Percentual inválido')
				.max(100, 'Percentual inválido'),
		),
});

export { SchemaEndorsementFranchise };
