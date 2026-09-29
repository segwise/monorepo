import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { serveStatic } from 'hono/bun';
import type { Server } from '@/@types/server';
import { marketingQueue } from '@/libraries/marketing/queue';

// Painel do BullMQ. Só owner/admin da corretora acessa.
function registerRoutersServicesMarketingQueues(server: Server) {
	const basePath = '/services/marketing/queues';

	const serverAdapter = new HonoAdapter(serveStatic);
	serverAdapter.setBasePath(basePath);

	createBullBoard({
		queues: [new BullMQAdapter(marketingQueue)],
		serverAdapter,
	});

	server.use('/queues/*', async (ctx, next) => {
		if (!['owner', 'admin'].includes(ctx.session.brokerRole ?? '')) {
			return ctx.json({ message: 'Não autorizado' }, 403);
		}

		return await next();
	});

	server.route('/queues', serverAdapter.registerPlugin());
}

export { registerRoutersServicesMarketingQueues };
