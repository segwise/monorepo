import type { Database } from '@/@types/database';
import { Prisma } from '@segwise/database/client';
import type { DayRange } from './range';

// Mesmo produtor ignorado pelas contagens de apólices em analytics/policies
// (ver count.ts): fica fora dos números do dashboard para bater com o resto.
const EXCLUDED_PRODUCER_ID = '019f249d-8880-7000-b962-aace743e68e2';

type MetricKind =
	| 'policies-count'
	| 'net-premium'
	| 'quotes-count'
	| 'commission';

type MetricPoint = { date: string; value: number };

// O produtor de teste só aparece no painel dele: nenhuma consulta do painel da
// corretora (propostas, cotações, dashboard, financeiro) considera o que é dele.
const notTestProducer: {
	OR: Array<Prisma.SafeWhereInput & Prisma.QuoteWhereInput>;
} = {
	OR: [{ producerId: null }, { producerId: { not: EXCLUDED_PRODUCER_ID } }],
};

// Pagamentos em que o produtor de teste é pagador ou recebedor. Não usa `NOT`:
// com `user_id` nulo (corretora, seguradora) o SQL `NOT (NULL)` descartaria a
// linha e sumiria com todos os pagamentos.
const notTestUser = {
	OR: [{ userId: null }, { userId: { not: EXCLUDED_PRODUCER_ID } }],
};

const paymentNotTestProducer: Prisma.PaymentWhereInput = {
	AND: [
		{ OR: [{ payerId: null }, { payer: notTestUser }] },
		{ OR: [{ receiverId: null }, { receiver: notTestUser }] },
	],
};

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
	return {
		brokerId,
		requestedAt: { gte: range.tsFrom, lte: range.tsTo },
		AND: [notTestProducer],
	};
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

	// A soma é feita no banco (GROUP BY): trazer as linhas para somar em JS
	// pesava a memória e a rede quando o período é o ano inteiro.
	if (kind === 'quotes-count') {
		const rows = await database.$queryRaw<
			Array<{ day: string; total: number }>
		>(Prisma.sql`
			SELECT to_char(requested_at AT TIME ZONE ${timezone}, 'YYYY-MM-DD') AS day,
				count(*)::int AS total
			FROM quotes
			WHERE broker_id = ${brokerId}::uuid
				AND requested_at >= ${range.tsFrom}
				AND requested_at <= ${range.tsTo}
				AND (producer_id IS NULL OR producer_id <> ${EXCLUDED_PRODUCER_ID}::uuid)
			GROUP BY 1
		`);

		for (const row of rows) {
			add(row.day, row.total);
		}
	} else {
		// requestedAt é gravado em 00:00 UTC: agrupar pelo próprio valor é agrupar
		// por dia.
		const rows = await database.safe.groupBy({
			by: ['requestedAt'],
			where: productionWhere(database, brokerId, range),
			_count: { _all: true },
			_sum: { award: true, commissionGross: true },
		});

		for (const row of rows) {
			add(
				row.requestedAt.toISOString().slice(0, 10),
				kind === 'policies-count'
					? row._count._all
					: kind === 'net-premium'
						? (row._sum.award?.toNumber() ?? 0)
						: (row._sum.commissionGross?.toNumber() ?? 0),
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
	notTestProducer,
	paymentNotTestProducer,
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
