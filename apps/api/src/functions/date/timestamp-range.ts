import { fromZonedTime } from 'date-fns-tz';

// Intervalo de dias para colunas `timestamptz` (ex.: `Quote.requestedAt`).
//
// `start`/`end` chegam do schema do core (`SchemaDateRange`) já reduzidos a
// início/fim do dia UTC; o que vale é o RÓTULO do dia (data UTC). Os limites são
// os do dia no fuso do usuário (`X-timezone`): um registro das 22h de 31/10 em
// Brasília (01h UTC de 01/11) entra em outubro, e um das 21h de 30/09 não.
// Usar `startOfDay`/`endOfDay` do servidor (UTC) deslocava 3h os limites.
const dayLabel = (date: Date) => date.toISOString().slice(0, 10);

function timestampRange(
	range: { start: Date; end: Date },
	timezone: string,
): { gte: Date; lte: Date } {
	return {
		gte: fromZonedTime(`${dayLabel(range.start)}T00:00:00.000`, timezone),
		lte: fromZonedTime(`${dayLabel(range.end)}T23:59:59.999`, timezone),
	};
}

export { timestampRange };
