import type { Server } from '@/@types/server';

function registerRoutersServicesMigration(server: Server) {
	const base = server.basePath('/migration');

	base.get('/report', async (ctx) => {
		const report = JSON.parse(
			(await ctx.cache.get('reportSafeMigration')) ?? '{}',
		);

		return ctx.json(report, 200);
	});
}

export { registerRoutersServicesMigration };
