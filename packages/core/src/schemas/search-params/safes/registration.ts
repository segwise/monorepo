import { startOfDay } from 'date-fns';

import z from 'zod';

import { isDateString } from '../../../valids/date';
import { SchemaCPFOrCNPJ } from '../../utils';

const SchemaSearchParamsSafeRegistration = z
	.object({
		registration: SchemaCPFOrCNPJ,
		birth: z.string('Data inválida').refine(isDateString, 'Data inválida'),
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

export { SchemaSearchParamsSafeRegistration };
