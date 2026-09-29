import type { Database } from '@/@types/database';
import type { Prisma } from '@/generated/prisma/client';
import { type DayRange, dayKey } from './range';

// Mesmo produtor ignorado pelas contagens de apólices em analytics/policies
// (ver count.ts): fica fora dos números do dashboard para bater com o resto.
const EXCLUDED_PRODUCER_ID = '019f249d-8880-7000-b962-aace743e68e2';

type MetricKind =
	| 'policies-count'
	| 'net-premium'
	| 'quotes-count'
	| 'commission';

type MetricPoint = { date: string; value: number };

// Produção = proposta. Tudo no sistema é proposta; uma apólice só existe se
// foi cadastrada como tal ou confirmada manualmente (effectivedAt), e mesmo
// assim conta como qualquer outra proposta aqui.
// - Data da produção: requestedAt (início da vigência). Ele é gravado em
//   00:00 UTC, por isso é comparado por data UTC e não pelo fuso do usuário.
// - Fora: só quem perdeu a vigência por cancelamento ANTES do fim dela. O
//   sistema marca como "canceled" também o seguro que apenas terminou a
//   vigência (statusAt >= expiration), e esse continua sendo produção do
//   período em que foi vendido.
// - Fora também: externos e o produtor de teste (mesma exclusão de
//   analytics/proposals/count.ts).
function productionWhere(
	database: Database,
	brokerId: string,
	range: DayRange,
): Prisma.SafeWhereInput {
	const endExclusive = new Date(range.dateTo);
	endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

	return {
		brokerId,
		requestedAt: { gte: range.dateFrom, lt: endExclusive },
		AND: [
			{
				OR: [
					{ status: { not: 'canceled' } },
					{ statusAt: { gte: database.safe.fields.expiration } },
				],
			},
			{ OR: [{ isExternal: false }, { isExternal: null }] },
			{
				OR: [
					{ producerId: null },
					{ producerId: { not: EXCLUDED_PRODUCER_ID } },
				],
			},
		],
	};
}

function quotesWhere(
	brokerId: string,
	range: DayRange,
): Prisma.QuoteWhereInput {
	return { brokerId, requestedAt: { gte: range.tsFrom, lte: range.tsTo } };
}

async function metricSeries(
	database: Database,
	brokerId: string,
	kind: MetricKind,
	range: DayRange,
	timezone: string,
): Promise<MetricPoint[]> {
	const totals = new Map<string, number>(range.days.map((day) => [day, 0]));

	const add = (key: string, value: number) =>
		totals.set(key, (totals.get(key) ?? 0) + value);

	if (kind === 'quotes-count') {
		const quotes = await database.quote.findMany({
			where: quotesWhere(brokerId, range),
			select: { requestedAt: true },
		});

		for (const quote of quotes) {
			add(dayKey(quote.requestedAt, timezone), 1);
		}
	} else {
		const safes = await database.safe.findMany({
			where: productionWhere(database, brokerId, range),
			select: { requestedAt: true, award: true, commissionGross: true },
		});

		for (const safe of safes) {
			const key = safe.requestedAt.toISOString().slice(0, 10);

			add(
				key,
				kind === 'policies-count'
					? 1
					: kind === 'net-premium'
						? (safe.award?.toNumber() ?? 0)
						: (safe.commissionGross?.toNumber() ?? 0),
			);
		}
	}

	return range.days.map((date) => ({
		date,
		value: Math.round((totals.get(date) ?? 0) * 100) / 100,
	}));
}

const sumSeries = (series: MetricPoint[]) =>
	series.reduce((total, point) => total + point.value, 0);

function median(values: number[]) {
	if (!values.length) {
		return 0;
	}

	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);

	return sorted.length % 2
		? (sorted[middle] as number)
		: ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}

function monthlyTotals(series: MetricPoint[]) {
	const totals = new Map<string, number>();

	for (const point of series) {
		const month = point.date.slice(0, 7);

		totals.set(month, (totals.get(month) ?? 0) + point.value);
	}

	return [...totals.values()];
}

// Soma de meses em que nenhum mês passa de 1,5× nem fica abaixo de 0,5× a
// mediana: um mês atípico (ex.: uma apólice frota gigante) não distorce a
// projeção.
function cappedTotal(months: number[]) {
	const mid = median(months);

	return months.reduce(
		(total, value) => total + Math.min(mid * 1.5, Math.max(mid * 0.5, value)),
		0,
	);
}

export {
	EXCLUDED_PRODUCER_ID,
	cappedTotal,
	median,
	monthlyTotals,
	metricSeries,
	productionWhere,
	quotesWhere,
	sumSeries,
	type MetricKind,
	type MetricPoint,
};
