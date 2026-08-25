import type { Server } from '@/@types/server.d';
import { registerRoutersServices } from '@/routers/services';
import { database } from '@/services/database';
import { registerRoutersRedirects } from './redirects';

function registerRouters(server: Server) {
	registerRoutersServices(server);

	registerRoutersRedirects(server);
}

database.account
	.findMany({
		where: { providerId: 'credential' },
	})
	.then((response) => {
		database.account
			.updateMany({
				where: {
					id: {
						in: response.flatMap((response) => response.id),
					},
				},
				data: {
					issuer: 'local:credential',
				},
			})
			.then(console.log);
	});

export { registerRouters };
