import type { Server } from '@/@types/server';
import { registerRoutersServicesUtilsInsuranceCompaniesById } from './[id]';
import { registerRoutersServicesUtilsInsuranceCompaniesListining } from './listining';

function registerRoutersServicesUtilsInsuranceCompanies(server: Server) {
	const base = server.basePath('/insurance-companies');

	registerRoutersServicesUtilsInsuranceCompaniesById(base);
	registerRoutersServicesUtilsInsuranceCompaniesListining(base);
}

export { registerRoutersServicesUtilsInsuranceCompanies };
