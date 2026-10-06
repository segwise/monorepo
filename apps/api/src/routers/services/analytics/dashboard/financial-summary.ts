import { addDays } from 'date-fns';
import type { Server } from '@/@types/server';
import { paymentNotTestProducer } from '@/libraries/dashboard/metrics';
import { requireBrokerId } from './query';

function registerRoutersServicesAnalyticsDashboardFinancialSummary(
	server: Server,
) {
	server.get('/financial-summary', async (ctx) => {
		const brokerId = requireBrokerId(ctx);
		const now = new Date();
		const next30Days = addDays(now, 30);

		const sum = (where: Parameters<typeof ctx.database.payment.aggregate>[0]) =>
			ctx.database.payment.aggregate({ ...where, _sum: { amount: true } });

		const [receivable, payable, pendingCommission, overdue] = await Promise.all(
			[
				sum({
					where: {
						...paymentNotTestProducer,
						receiver: { brokerId },
						status: 'waiting',
						expiration: { gte: now, lte: next30Days },
					},
				}),
				sum({
					where: {
						...paymentNotTestProducer,
						payer: { brokerId },
						status: 'waiting',
						expiration: { gte: now, lte: next30Days },
					},
				}),
				sum({
					where: {
						...paymentNotTestProducer,
						receiver: { brokerId },
						payer: { insuranceCompanyId: { not: null } },
						status: 'waiting',
					},
				}),
				sum({
					where: {
						...paymentNotTestProducer,
						receiver: { brokerId },
						status: 'waiting',
						expiration: { lt: now },
					},
				}),
			],
		);

		const value = (result: {
			_sum: { amount: { toNumber(): number } | null };
		}) => result._sum.amount?.toNumber() ?? 0;

		return ctx.json(
			{
				receivableNext30Days: value(receivable),
				payableNext30Days: value(payable),
				pendingCommissionFromInsurers: value(pendingCommission),
				overdueReceivable: value(overdue),
			},
			200,
		);
	});
}

export { registerRoutersServicesAnalyticsDashboardFinancialSummary };
