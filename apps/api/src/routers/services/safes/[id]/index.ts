import z from 'zod';
import type { Server } from '@/@types/server.d';
import { registerRoutersServicesSafesByIdDelete } from '@/routers/services/safes/[id]/delete';
import { registerRoutersServicesSafesByIdListining } from '@/routers/services/safes/[id]/listinig';

function registerRoutersServicesSafesById(server: Server) {
	const base = server.basePath(
		`/:id{${z.regexes.uuid7.source.slice(1).slice(0, -1)}}`,
	);

	registerRoutersServicesSafesByIdListining(base);
	registerRoutersServicesSafesByIdDelete(base);
}

export { registerRoutersServicesSafesById };
