import type { Server } from '@/@types/server';
import { requireSession } from '@/services/server/middlewares/session';
import { registerRoutersServicesAuthProfileDetailsProducer } from './details-producer';

function registerRoutersServicesAuthProfile(server: Server) {
	const base = server.basePath('/profile');

	base.use(requireSession);

	registerRoutersServicesAuthProfileDetailsProducer(base);
}

export { registerRoutersServicesAuthProfile };
