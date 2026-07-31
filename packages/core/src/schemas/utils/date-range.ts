import { endOfDay, parseISO, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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
					start: startOfDay(toZonedTime(parseISO(props), 'UTC')),
					end: endOfDay(toZonedTime(parseISO(props), 'UTC')),
				}
			: props instanceof Date
				? {
						start: startOfDay(toZonedTime(props, 'UTC')),
						end: endOfDay(toZonedTime(props, 'UTC')),
					}
				: {
						start: startOfDay(
							toZonedTime(
								props.start instanceof Date
									? props.start
									: parseISO(props.start),
								'UTC',
							),
						),
						end: endOfDay(
							toZonedTime(
								props.end instanceof Date ? props.end : parseISO(props.end),
								'UTC',
							),
						),
					},
	);

export { SchemaDateRange };
