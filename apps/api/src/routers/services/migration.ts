import type { Server } from '@/@types/server';
import { migration } from '@/services/queues/workers/migration';

function registerRoutersServicesMigration(server: Server) {
	const base = server.basePath('/migration');

	base.get('/', async (ctx) => {
		await migration();

		return ctx.json({ ok: true }, 200);
	});

	base.get('/report', async (ctx) => {
		const report = JSON.parse(
			(await ctx.cache.get('reportSafeMigration')) ?? '{}',
		);

		return ctx.json(report, 200);
	});
}

export { registerRoutersServicesMigration };
