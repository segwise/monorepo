import type { Server } from '@/@types/server.d';
import { responseReplaceSession } from '@/functions/response/replace-session';
import { registerRoutersServicesAuthProfile } from './profile';

function registerRoutersServicesAuth(server: Server) {
	const base = server.basePath('/auth');

	registerRoutersServicesAuthProfile(base);

	base.on(['POST', 'GET'], '*', async (ctx) => {
		console.log('raw:', ctx.req.raw);
		const handler = await ctx.auth.handler(ctx.req.raw);
		console.log('handler:', handler);

		const response = await responseReplaceSession(handler, ctx);
		console.log('response:', response);

		return response;
	});
}

export { registerRoutersServicesAuth };
