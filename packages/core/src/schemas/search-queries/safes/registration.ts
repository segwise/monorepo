import { startOfDay } from 'date-fns';

import z from 'zod';
import { isDateString } from '../../../valids/date';
import { SchemaCPF } from '../../utils';

const SchemaSearchQueriesSafeRegistration = z
	.object({
		registration: SchemaCPF,
		birth: z
			.string('Data de nascimento inválida')
			.refine(isDateString, 'Data de nascimento inválida'),
	})
	.transform(({ registration, birth }) => ({
		registration,
		birth: startOfDay(
			new Date(
				Number(birth.split('/')[2]),
				Number(birth.split('/')[1]) - 1,
				Number(birth.split('/')[0]),
			),
		),
	}));

export { SchemaSearchQueriesSafeRegistration };
