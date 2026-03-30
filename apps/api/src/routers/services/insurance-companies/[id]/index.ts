import z from 'zod';
import type { Server } from '@/@types/server.d';
import { registerRoutersServicesInsuranceCompaniesByIdListining } from './listinig';

function registerRoutersServicesInsuranceCompaniesById(server: Server) {
	const base = server.basePath(
		`/:id{${z.regexes.uuid7.source.slice(1).slice(0, -1)}}`,
	);

	registerRoutersServicesInsuranceCompaniesByIdListining(base);
}

export { registerRoutersServicesInsuranceCompaniesById };
