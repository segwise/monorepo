import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { serveStatic } from 'hono/bun';
import type { Server } from '@/@types/server';
import { environment } from '@/libraries/environment';
import { marketingQueue } from '@/libraries/marketing/queue';

// Painel do BullMQ. Só owner/admin da corretora acessa.
function registerRoutersServicesMarketingQueues(server: Server) {
	// Em dev o host "localhost" já injeta o prefixo /services (ver server/index.ts).
	const basePath =
		environment.NODE_ENV === 'development'
			? '/marketing/queues'
			: '/services/marketing/queues';

	// Em dev o path interno da requisição tem o prefixo /services, mas o
	// basePath do painel não: tira o prefixo antes do rewrite dos estáticos.
	const staticHandler: typeof serveStatic = (options) =>
		serveStatic({
			...options,
			rewriteRequestPath: (path) =>
				options?.rewriteRequestPath?.(
					environment.NODE_ENV === 'development'
						? path.replace(/^\/services/, '')
						: path,
				) ?? path,
		});

	const serverAdapter = new HonoAdapter(staticHandler);
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
