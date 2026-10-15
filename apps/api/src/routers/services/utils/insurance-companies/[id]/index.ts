import z from 'zod';
import type { Server } from '@/@types/server.d';
import { registerRoutersServicesUtilsInsuranceCompaniesByIdListining } from './listinig';

function registerRoutersServicesUtilsInsuranceCompaniesById(server: Server) {
	const base = server.basePath(
		`/:id{${z.regexes.uuid7.source.slice(1).slice(0, -1)}}`,
	);

	registerRoutersServicesUtilsInsuranceCompaniesByIdListining(base);
}

export { registerRoutersServicesUtilsInsuranceCompaniesById };
