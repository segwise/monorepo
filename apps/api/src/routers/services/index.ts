import type { Server } from '@/@types/server.d';

import { registerRoutersServicesAnalytics } from '@/routers/services/analytics';
import { registerRoutersServicesAuth } from '@/routers/services/auth';
import { registerRoutersServicesInsuranceCompanies } from '@/routers/services/insurance-companies';
import { registerRoutersServicesPayments } from '@/routers/services/payments';
import { registerRoutersServicesProducers } from '@/routers/services/producers';
import { registerRoutersServicesProfessions } from '@/routers/services/professions';
import { registerRoutersServicesQuotes } from '@/routers/services/quotes';
import { registerRoutersServicesSafes } from '@/routers/services/safes';
import { registerRoutersServicesVehicles } from '@/routers/services/vehicles';

function registerRoutersServices(server: Server) {
	const base = server.basePath('/services');

	registerRoutersServicesAuth(base);
	registerRoutersServicesProducers(base);
	registerRoutersServicesProfessions(base);
	registerRoutersServicesVehicles(base);
	registerRoutersServicesQuotes(base);
	registerRoutersServicesSafes(base);
	registerRoutersServicesInsuranceCompanies(base);
	registerRoutersServicesAnalytics(base);
	registerRoutersServicesPayments(base);
}

export { registerRoutersServices };
