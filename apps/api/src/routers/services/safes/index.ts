import type { Server } from '@/@types/server.d';

import { registerRoutersServicesSafesSimpleListining } from '@/routers/services/safes/listinig';

function registerRoutersServicesSafes(server: Server) {
	const base = server.basePath('/safes');

	registerRoutersServicesSafesSimpleListining(base);
}

export { registerRoutersServicesSafes };
