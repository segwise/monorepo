import type { Server } from '@/@types/server.d';

import { registerRoutersServicesBrokersListining } from './listinig';

function registerRoutersServicesBrokers(server: Server) {
	const base = server.basePath('/brokers');

	registerRoutersServicesBrokersListining(base);
}

export { registerRoutersServicesBrokers };
