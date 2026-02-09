import type { Server } from '@/@types/server.d';

import { registerRoutersProfessionsListining } from '@/routers/services/professions/listinig';

function registerRoutersProfessions(server: Server) {
	const base = server.basePath('/professions');

	registerRoutersProfessionsListining(base);
}

export { registerRoutersProfessions };
