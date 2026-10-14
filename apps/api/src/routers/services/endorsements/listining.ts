import type { Server } from '@/@types/server';
import {
	describeChanges,
	getRevertStatus,
	isSnapshot,
} from '@/functions/endorsements/snapshot';

function registerRoutersServicesEndorsementsListining(server: Server) {
	server.get('/', async (ctx) => {
		const id = ctx.req.param('id');

		const endorsements = await ctx.database.endorsement.findMany({
			where: {
				safeId: id,
			},
			select: {
				id: true,
				type: true,
				effectivedAt: true,
				createdAt: true,
				revertedAt: true,
				snapshot: true,
			},
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
		});

		// Só o mais recente ainda não revertido pode ser revertido (ver snapshot.ts).
		const latestRevertibleId =
			endorsements.find((endorsement) => !endorsement.revertedAt)?.id ?? null;

		const response = endorsements.map(({ snapshot, ...endorsement }) => {
			const { canRevert, reason, until } = getRevertStatus({
				endorsement: { ...endorsement, snapshot },
				latestRevertibleId,
			});

			return {
				...endorsement,
				revert: {
					canRevert,
					reason,
					until,
					// O que a reversão devolve (de → para), para o painel mostrar.
					changes: isSnapshot(snapshot) ? describeChanges(snapshot) : [],
				},
			};
		});

		return ctx.json(response, 200);
	});

	server.get('/percentage', async (ctx) => {
		const id = ctx.req.param('id');

		const response = await ctx.database.safe.findUnique({
			where: {
				id,
			},
			select: {
				commissionPercentage: true,
			},
		});

		return ctx.json(
			{
				percentage: response?.commissionPercentage || 0,
			},
			200,
		);
	});
}

export { registerRoutersServicesEndorsementsListining };
