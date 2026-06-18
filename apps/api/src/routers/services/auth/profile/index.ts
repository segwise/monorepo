import type { Server } from '@/@types/server';
import { registerRoutersServicesAuthProfileDetailsProducer } from './details-producer';

function registerRoutersServicesAuthProfile(server: Server) {
	const base = server.basePath('/profile');

	registerRoutersServicesAuthProfileDetailsProducer(base);
}

export { registerRoutersServicesAuthProfile };
