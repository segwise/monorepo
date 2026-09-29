import z from 'zod';
import type { Server } from '@/@types/server.d';
import { registerRoutersServicesProducersByIdUpdate } from './update';
import { registerRoutersServicesProducersByIdUpdateInternal } from './update-internal';

function registerRoutersServicesProducersById(server: Server) {
	const base = server.basePath(
		`/:id{${z.regexes.uuid7.source.slice(1).slice(0, -1)}}`,
	);

	registerRoutersServicesProducersByIdUpdate(base);
	registerRoutersServicesProducersByIdUpdateInternal(base);
}

export { registerRoutersServicesProducersById };
