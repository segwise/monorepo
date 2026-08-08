import { z } from 'zod';
import type { Server } from '@/@types/server';
import { registerRoutersServicesEndorsementsCancel } from './cancel';
import { registerRoutersServicesEndorsementsFranchise } from './franchise';
import { registerRoutersServicesEndorsementsListining } from './listining';

function registerRoutersServicesEndorsements(server: Server) {
	const base = server.basePath(
		`/endorsements/:id{${z.regexes.uuid7.source.slice(1).slice(0, -1)}}`,
	);

	registerRoutersServicesEndorsementsListining(base);
	registerRoutersServicesEndorsementsFranchise(base);
	registerRoutersServicesEndorsementsCancel(base);
}

export { registerRoutersServicesEndorsements };
