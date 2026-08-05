import { differenceInYears, parse, startOfToday } from 'date-fns';

import z from 'zod';

const SchemaBirth = z
	.string('Data de nascimento inválida')
	.regex(
		/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/,
		'Data de nascimento inválida',
	)
	.transform((value) => parse(value, 'dd/MM/yyyy', startOfToday()))
	.or(z.coerce.date('Data de nascimento inválida'))
	.refine((date) => date <= new Date(), {
		message: 'A data de nascimento não pode ser no futuro',
	})
	.refine((date) => differenceInYears(new Date(), date) >= 18, {
		message: 'Não pode ser menor de 18 anos',
	});

const SchemaBirthNoValidation = z
	.string('Data de nascimento inválida')
	.regex(
		/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/,
		'Data de nascimento inválida',
	)
	.transform((value) => parse(value, 'dd/MM/yyyy', startOfToday()))
	.or(z.coerce.date('Data de nascimento inválida'))
	.refine((date) => date <= new Date(), {
		message: 'A data de nascimento não pode ser no futuro',
	});

export { SchemaBirth, SchemaBirthNoValidation };
