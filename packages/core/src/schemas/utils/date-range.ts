import { endOfDay, parseISO, startOfDay } from 'date-fns';

import z from 'zod';

const SchemaIsoDateTimeRange = z.iso
	.datetime('Data de solicitação inválida')
	.or(
		z.object({
			start: z.iso.datetime('Data inicial de solicitação inválida'),
			end: z.iso.datetime('Data final de solicitação inválida'),
		}),
	);

const SchemaDateRange = z
	.date('Data de solicitação inválida')
	.or(
		z.object({
			start: z.date('Data inicial de solicitação inválida'),
			end: z.date('Data final de solicitação inválida'),
		}),
	)
	.or(SchemaIsoDateTimeRange)
	.transform((props) =>
		typeof props === 'string'
			? {
					start: startOfDay(parseISO(props)),
					end: endOfDay(parseISO(props)),
				}
			: props instanceof Date
				? {
						start: startOfDay(props),
						end: endOfDay(props),
					}
				: {
						start: startOfDay(
							props.start instanceof Date ? props.start : parseISO(props.start),
						),
						end: '',
					},
	);

export { SchemaDateRange };
