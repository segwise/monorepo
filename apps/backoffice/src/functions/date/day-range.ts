import { startOfDay } from 'date-fns';

type DayRangeParam =
	| string
	| Date
	| { start: Date | string; end: Date | string };

// O `nuqs` lê `effectivedAt` com o schema do core, que transforma o intervalo em
// início do dia (start) e FIM do dia (end, 23:59:59.999 local). Em UTC o fim do
// dia local vira o dia seguinte e o backend (que compara o dia UTC, de forma
// inclusiva, em colunas `date`) incluiria um dia a mais. Antes de enviar,
// reduzimos as duas pontas para o início do dia: no Brasil meia-noite local =
// 03:00Z, que continua sendo o mesmo dia em UTC. Ver docs/CONVENTIONS.md.
function toDayRangeParam<T extends DayRangeParam | null | undefined>(
	value: T,
): T {
	if (!value) {
		return value;
	}

	// String ISO já é o valor cru da URL (o backend normaliza o dia).
	if (typeof value === 'string') {
		return value;
	}

	if (value instanceof Date) {
		return startOfDay(value) as T;
	}

	return {
		start: startOfDay(new Date(value.start)),
		end: startOfDay(new Date(value.end)),
	} as T;
}

export { toDayRangeParam };
