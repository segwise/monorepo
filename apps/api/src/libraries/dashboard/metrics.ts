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

// Apólice "emitida" = início de vigência dentro do período, sem cancelada,
// sem externa e sem o produtor de teste.
function policiesWhere(
	brokerId: string,
	range: DayRange,
): Prisma.SafeWhereInput {
	return {
		brokerId,
		effectivedAt: { gte: range.dateFrom, lte: range.dateTo },
		status: { not: 'canceled' },
		AND: [
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
			where: policiesWhere(brokerId, range),
			select: { effectivedAt: true, award: true, commissionGross: true },
		});

		for (const safe of safes) {
			if (!safe.effectivedAt) {
				continue;
			}

			const key = safe.effectivedAt.toISOString().slice(0, 10);

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

export {
	EXCLUDED_PRODUCER_ID,
	metricSeries,
	policiesWhere,
	quotesWhere,
	sumSeries,
	type MetricKind,
	type MetricPoint,
};
