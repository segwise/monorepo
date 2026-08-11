import { z } from 'zod';
import { getNumericValue } from '../../utils';
import { SchemaPostalCode } from '../utils';

const SchemaEndorsementAddress = z.object({
	postalCode: SchemaPostalCode,
	amount: z
		.string('Valor inválido')
		.transform(getNumericValue)
		.or(z.coerce.number('Valor inválido')),
	percentage: z
		.string('Percentual inválido')
		.transform(getNumericValue)
		.refine((val) => val >= 0 && val <= 100, {
			message: 'Percentual inválido',
		})
		.or(
			z.coerce
				.number('Percentual inválido')
				.min(0, 'Percentual inválido')
				.max(100, 'Percentual inválido'),
		),
});

export { SchemaEndorsementAddress };
