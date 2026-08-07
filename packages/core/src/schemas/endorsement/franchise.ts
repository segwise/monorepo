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
		.or(z.coerce.number('Valor inválido').min(0, 'Valor inválido')),
	percentage: z.coerce
		.number('Percentual de comissão inválidas')
		.min(1, 'Percentual de comissão inválidas')
		.max(100, 'Percentual de comissão inválidas'),
	commission: z
		.string('Comissão inválida')
		.transform(getNumericValueMoney)
		.or(z.coerce.number('Comissão inválida').min(0, 'Comissão inválida')),
});

export { SchemaEndorsementFranchise };
