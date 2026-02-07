import { differenceInYears } from 'date-fns';

import z from 'zod';

const SchemaBirth = z.coerce
	.date('Data de nascimento inválida')
	.refine(
		(date) => differenceInYears(date, new Date()) >= 18,
		'Não deve ser menor de 18 anos',
	);

export { SchemaBirth };
