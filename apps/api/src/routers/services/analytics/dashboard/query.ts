import z from 'zod';
import type { Context } from '@/@types/server';
import { buildRange } from '@/libraries/dashboard/range';

const SchemaDashboardPeriod = z.object({
	from: z.coerce.date('Período inválido'),
	to: z.coerce.date('Período inválido'),
	refFrom: z.coerce.date('Período de comparação inválido'),
	refTo: z.coerce.date('Período de comparação inválido'),
});

const SchemaDashboardMetricKind = z.enum([
	'policies-count',
	'net-premium',
	'quotes-count',
	'commission',
]);

function requireBrokerId(ctx: Pick<Context, 'session'>) {
	const brokerId = ctx.session.brokerId;

	if (!brokerId) {
		throw new Error('Nenhuma corretora vinculada');
	}

	return brokerId;
}

function periodRanges(
	period: z.infer<typeof SchemaDashboardPeriod>,
	timezone: string,
) {
	return {
		current: buildRange(period.from, period.to, timezone),
		reference: buildRange(period.refFrom, period.refTo, timezone),
	};
}

export {
	SchemaDashboardPeriod,
	SchemaDashboardMetricKind,
	requireBrokerId,
	periodRanges,
};
