import { addDays, differenceInCalendarDays, subDays } from 'date-fns';
import type { Server } from '@/@types/server';
import type { Prisma } from '@/generated/prisma/client';
import {
	notTestProducer,
	paymentNotTestProducer,
} from '@/libraries/dashboard/metrics';
import { dayKey } from '@/libraries/dashboard/range';
import { requireBrokerId } from './query';

const STALLED_QUOTE_DAYS = 2;
const AWAITING_CUSTOMER_DAYS = 3;
const EXPIRING_POLICY_DAYS = 30;
// Cotações paradas há mais que isso são consideradas abandonadas e não
// entram como pendência (senão o histórico antigo inflaria o número).
const ABANDONED_QUOTE_DAYS = 90;
const ITEMS_PER_GROUP = 5;

function registerRoutersServicesAnalyticsDashboardActionRequired(
	server: Server,
) {
	server.get('/action-required', async (ctx) => {
		const brokerId = requireBrokerId(ctx);
		const now = new Date();
		// Colunas `date` ficam em UTC 00:00: "hoje" é o dia do usuário (X-timezone),
		// não o dia UTC (à noite no Brasil o dia UTC já é o seguinte).
		const today = new Date(`${dayKey(now, ctx.timezone)}T00:00:00.000Z`);

		const stalledQuotes: Prisma.QuoteWhereInput = {
			brokerId,
			AND: [notTestProducer],
			status: { in: ['waiting', 'quoting'] },
			statusAt: {
				lt: subDays(now, STALLED_QUOTE_DAYS),
				gte: subDays(now, ABANDONED_QUOTE_DAYS),
			},
		};

		const awaitingCustomer: Prisma.QuoteWhereInput = {
			brokerId,
			AND: [notTestProducer],
			status: 'sent',
			statusAt: {
				lt: subDays(now, AWAITING_CUSTOMER_DAYS),
				gte: subDays(now, ABANDONED_QUOTE_DAYS),
			},
		};

		const expiringPolicies: Prisma.SafeWhereInput = {
			brokerId,
			status: 'active',
			expiration: {
				gte: today,
				lte: addDays(today, EXPIRING_POLICY_DAYS),
			},
			successorSafe: null,
			AND: [
				{ OR: [{ isExternal: false }, { isExternal: null }] },
				notTestProducer,
			],
		};

		const overduePayments: Prisma.PaymentWhereInput = {
			receiver: { brokerId },
			...paymentNotTestProducer,
			status: 'waiting',
			expiration: { lt: now },
		};

		const quoteSelect = {
			id: true,
			statusAt: true,
			insured: { select: { name: true } },
			temporaryInsured: { select: { name: true } },
			quoteVehicle: { select: { plate: true } },
		} as const;

		const [
			stalledCount,
			stalledItems,
			awaitingCount,
			awaitingItems,
			expiringCount,
			expiringItems,
			overdueCount,
			overdueItems,
		] = await Promise.all([
			ctx.database.quote.count({ where: stalledQuotes }),
			ctx.database.quote.findMany({
				where: stalledQuotes,
				select: quoteSelect,
				orderBy: { statusAt: 'asc' },
				take: ITEMS_PER_GROUP,
			}),
			ctx.database.quote.count({ where: awaitingCustomer }),
			ctx.database.quote.findMany({
				where: awaitingCustomer,
				select: quoteSelect,
				orderBy: { statusAt: 'asc' },
				take: ITEMS_PER_GROUP,
			}),
			ctx.database.safe.count({ where: expiringPolicies }),
			ctx.database.safe.findMany({
				where: expiringPolicies,
				select: {
					id: true,
					expiration: true,
					insured: { select: { name: true } },
					temporaryInsured: { select: { name: true } },
					safeVehicle: { select: { plate: true } },
				},
				orderBy: { expiration: 'asc' },
				take: ITEMS_PER_GROUP,
			}),
			ctx.database.payment.count({ where: overduePayments }),
			ctx.database.payment.findMany({
				where: overduePayments,
				select: { id: true, description: true, expiration: true },
				orderBy: { expiration: 'asc' },
				take: ITEMS_PER_GROUP,
			}),
		]);

		const nameOf = (item: {
			insured: { name: string } | null;
			temporaryInsured: { name: string } | null;
			quoteVehicle?: { plate: string | null } | null;
			safeVehicle?: { plate: string | null } | null;
		}) => {
			const name =
				item.insured?.name ?? item.temporaryInsured?.name ?? 'Sem nome';
			const plate = item.quoteVehicle?.plate ?? item.safeVehicle?.plate;

			return plate ? `${name} · ${plate}` : name;
		};

		const groups = [
			{
				kind: 'quote-stalled' as const,
				title: 'Cotações paradas',
				href: '/quotes',
				count: stalledCount,
				items: stalledItems.map((item) => ({
					id: item.id,
					kind: 'quote-stalled' as const,
					label: nameOf(item),
					daysOpen: differenceInCalendarDays(now, item.statusAt),
					href: '/quotes',
				})),
			},
			{
				kind: 'quote-awaiting-customer' as const,
				title: 'Cotações sem resposta do cliente',
				href: '/quotes',
				count: awaitingCount,
				items: awaitingItems.map((item) => ({
					id: item.id,
					kind: 'quote-awaiting-customer' as const,
					label: nameOf(item),
					daysOpen: differenceInCalendarDays(now, item.statusAt),
					href: '/quotes',
				})),
			},
			{
				kind: 'policy-expiring' as const,
				title: 'Propostas vencendo em 30 dias',
				href: '/proposals',
				count: expiringCount,
				items: expiringItems.map((item) => ({
					id: item.id,
					kind: 'policy-expiring' as const,
					label: nameOf(item),
					daysOpen: differenceInCalendarDays(item.expiration, today),
					href: '/proposals',
				})),
			},
			{
				kind: 'payment-overdue' as const,
				title: 'Recebimentos em atraso',
				href: '/finance/cash-flow',
				count: overdueCount,
				items: overdueItems.map((item) => ({
					id: item.id,
					kind: 'payment-overdue' as const,
					label: item.description ?? 'Pagamento',
					daysOpen: differenceInCalendarDays(now, item.expiration),
					href: '/finance/cash-flow',
				})),
			},
		];

		return ctx.json(
			{
				groups,
				totalCount: groups.reduce((total, group) => total + group.count, 0),
			},
			200,
		);
	});
}

export { registerRoutersServicesAnalyticsDashboardActionRequired };
