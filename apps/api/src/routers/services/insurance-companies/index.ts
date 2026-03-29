import type { Server } from '@/@types/server.d';
import { registerRoutersServicesInsuranceCompaniesById } from './[id]';
import { registerRoutersServicesInsuranceCompaniesListining } from './listinig';

function registerRoutersServicesInsuranceCompanies(server: Server) {
	const base = server.basePath('/insurance-companies');

	registerRoutersServicesInsuranceCompaniesById(base);
	registerRoutersServicesInsuranceCompaniesListining(base);
}

export { registerRoutersServicesInsuranceCompanies };
