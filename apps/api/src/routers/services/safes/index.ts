import type { Server } from '@/@types/server.d';

import { registerRoutersServicesSafesById } from '@/routers/services/safes/[id]';
import { registerRoutersServicesSafesSimpleListining } from '@/routers/services/safes/listinig';

function registerRoutersServicesSafes(server: Server) {
	const base = server.basePath('/safes');

	registerRoutersServicesSafesById(base);
	registerRoutersServicesSafesSimpleListining(base);
}

export { registerRoutersServicesSafes };
