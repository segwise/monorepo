import type { Server } from '@/@types/server';

import { registerRoutersServicesUtilsAcceptInvitation } from './accept-invitation';
import { registerRoutersServicesUtilsApplicationReferral } from './application-referral';
import { registerRoutersServicesUtilsFipe } from './fipe';
import { registerRoutersServicesUtilsInsuranceCompanies } from './insurance-companies';
import { registerRoutersServicesUtilsProducers } from './producers';
import { registerRoutersServicesUtilsQuotes } from './quotes';

function registerRoutersServicesUtils(server: Server) {
	registerRoutersServicesUtilsApplicationReferral(server);
	registerRoutersServicesUtilsAcceptInvitation(server);
	registerRoutersServicesUtilsQuotes(server);
	registerRoutersServicesUtilsProducers(server);
	registerRoutersServicesUtilsInsuranceCompanies(server);
	registerRoutersServicesUtilsFipe(server);
}

export { registerRoutersServicesUtils };
