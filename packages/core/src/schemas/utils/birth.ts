import { differenceInYears } from 'date-fns';

import z from 'zod';

const SchemaBirth = z.coerce
	.date('Data de nascimento inválida')
	.refine((date) => date <= new Date(), {
		message: 'A data de nascimento não pode ser no futuro',
	})
	.refine((date) => differenceInYears(new Date(), date) >= 18, {
		message: 'Não pode ser menor de 18 anos',
	});

export { SchemaBirth };
