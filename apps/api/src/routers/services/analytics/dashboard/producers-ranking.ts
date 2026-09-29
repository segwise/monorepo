import { zValidator } from '@hono/zod-validator';
import z from 'zod';
import type { Server } from '@/@types/server';
import { policiesWhere } from '@/libraries/dashboard/metrics';
import { buildRange } from '@/libraries/dashboard/range';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';
import { requireBrokerId, SchemaDashboardPeriod } from './query';

function registerRoutersServicesAnalyticsDashboardProducersRanking(
	server: Server,
) {
	server.get(
		'/producers-ranking',
		zValidator(
			'query',
			SchemaDashboardPeriod.pick({ from: true, to: true }).extend({
				limit: z.coerce.number().min(1).max(20).default(5),
			}),
		),
		async (ctx) => {
			const brokerId = requireBrokerId(ctx);
			const { from, to, limit } = ctx.req.valid('query');
			const range = buildRange(from, to, ctx.timezone);

			const grouped = await ctx.database.safe.groupBy({
				by: ['producerId'],
				where: { ...policiesWhere(brokerId, range), producerId: { not: null } },
				_count: { _all: true },
				_sum: { commissionGross: true },
				orderBy: { _sum: { commissionGross: 'desc' } },
				take: limit,
			});

			const users = await ctx.database.user.findMany({
				where: {
					id: { in: grouped.map((item) => item.producerId as string) },
				},
				select: { id: true, name: true, image: true },
			});

			const usersById = new Map(users.map((user) => [user.id, user]));

			return ctx.json(
				{
					items: grouped.map((item) => {
						const user = usersById.get(item.producerId as string);

						return {
							id: item.producerId as string,
							name: user?.name ?? 'Produtor removido',
							...(user?.image && {
								avatarUrl: getPresignedUrl(ctx.storage.images, user.image),
							}),
							policiesClosed: item._count._all,
							commissionGenerated: item._sum.commissionGross?.toNumber() ?? 0,
						};
					}),
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesAnalyticsDashboardProducersRanking };
