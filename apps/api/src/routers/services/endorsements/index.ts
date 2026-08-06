import { z } from 'zod';
import type { Server } from '@/@types/server';
import { registerRoutersServicesEndorsementsListining } from './listining';

function registerRoutersServicesEndorsements(server: Server) {
	const base = server.basePath(
		`/endorsements/:id{${z.regexes.uuid7.source.slice(1).slice(0, -1)}}`,
	);

	registerRoutersServicesEndorsementsListining(base);
}

export { registerRoutersServicesEndorsements };
