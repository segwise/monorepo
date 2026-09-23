import type { Server } from '@/@types/server';
import { buildProducerPortalUrl } from '@/functions/hostname/build-producer-portal-url';

function registerRoutersServicesProducersPublicLink(server: Server) {
	server.get('/public-link', async (ctx) => {
		const brokerId = ctx.session?.brokerId;

		if (!brokerId) {
			return ctx.json({ message: 'Nenhuma corretora vinculada' }, 400);
		}

		const broker = await ctx.database.broker.findUnique({
			where: { id: brokerId },
			select: { slug: true },
		});

		if (!broker) {
			return ctx.json({ message: 'Corretora não encontrada' }, 404);
		}

		const url = buildProducerPortalUrl(
			ctx.environment,
			`/register/${broker.slug}`,
		);

		return ctx.json({ url }, 200);
	});
}

export { registerRoutersServicesProducersPublicLink };
