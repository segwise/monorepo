import type { Server } from '@/@types/server';
import { registerRoutersServicesInsuranceCompaniesListining } from './listinig';

function registerRoutersServicesInsuranceCompanies(server: Server) {
	const base = server.basePath('/insurance-companies');

	registerRoutersServicesInsuranceCompaniesListining(base);
}

export { registerRoutersServicesInsuranceCompanies };
