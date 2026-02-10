import type { Server } from '@/@types/server.d';

import { registerRoutersServicesProfessionsListining } from '@/routers/services/professions/listinig';

function registerRoutersServicesProfessions(server: Server) {
	const base = server.basePath('/professions');

	registerRoutersServicesProfessionsListining(base);
}

export { registerRoutersServicesProfessions };
