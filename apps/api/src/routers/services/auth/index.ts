import type { Server } from '@/@types/server.d';
import { responseReplaceSession } from '@/functions/response/replace-session';
import { registerRoutersServicesAuthProfile } from './profile';

function registerRoutersServicesAuth(server: Server) {
	const base = server.basePath('/auth');

	registerRoutersServicesAuthProfile(base);

	base.on(['POST', 'GET'], '*', async (ctx) => {
		// Suspenso/excluído com sessão ainda aberta não pode parecer logado:
		// sem isso o proxy do front o deixaria entrar nas telas (sem dados).
		if (ctx.req.method === 'GET' && ctx.req.path.endsWith('/get-session')) {
			const current = await ctx.auth.api.getSession({
				headers: ctx.req.raw.headers,
			});

			// @ts-expect-error
			const brokerStatus = current?.session.brokerStatus as string | undefined;

			if (brokerStatus && brokerStatus !== 'active') {
				return ctx.json(null, 200);
			}
		}

		const handler = await ctx.auth.handler(ctx.req.raw);

		const response = await responseReplaceSession(handler, ctx);

		return response;
	});
}

export { registerRoutersServicesAuth };
