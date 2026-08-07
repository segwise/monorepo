import { z } from 'zod';
import { getNumericValueMoney } from '../../utils';

const SchemaEndorsementFranchise = z.object({
	franchise: z
		.string('Frânquia inválido')
		.transform(getNumericValueMoney)
		.or(z.coerce.number('Frânquia inválido').min(0, 'Frânquia inválido')),
	amount: z
		.string('Valor inválido')
		.transform(getNumericValueMoney)
		.or(z.coerce.number('Frânquia inválido').min(1, 'Frânquia inválido'))
		.refine((value) => value > 0, 'Frânquia inválido'),
	percentage: z.coerce
		.number('Percentual inválidas')
		.min(1, 'Percentual inválidas')
		.max(100, 'Percentual inválidas'),
	commission: z
		.string('Comissão inválida')
		.transform(getNumericValueMoney)
		.or(z.coerce.number('Comissão inválida').min(0, 'Comissão inválida')),
});

export { SchemaEndorsementFranchise };
