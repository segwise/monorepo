import type { Server } from '@/@types/server.d';
import { registerRoutersServices } from '@/routers/services';
import { registerRoutersRedirects } from './redirects';

function registerRouters(server: Server) {
	registerRoutersServices(server);

	registerRoutersRedirects(server);

	// TEMPORÁRIO — remover depois de usar
	server.get('/debug/fix-account-issuer', async (ctx) => {
		const affected = await ctx.database.account.findMany({
			where: {
				providerId: 'credential',
				OR: [{ issuer: null }, { issuer: { not: 'local:credential' } }],
			},
			select: { id: true, userId: true, issuer: true },
		});

		const result = await ctx.database.account.updateMany({
			where: {
				providerId: 'credential',
				OR: [{ issuer: null }, { issuer: { not: 'local:credential' } }],
			},
			data: {
				issuer: 'local:credential',
			},
		});

		return ctx.json({
			affectedBefore: affected,
			totalAffected: affected.length,
			totalFixed: result.count,
		});
	});
}

export { registerRouters };
