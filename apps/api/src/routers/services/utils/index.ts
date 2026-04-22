import type { Server } from '@/@types/server';

import { registerRoutersServicesUtilsAcceptInvitation } from './accept-invitation';
import { registerRoutersServicesUtilsDownloadApplication } from './download-application';
import { registerRoutersServicesUtilsInsuranceCompanies } from './insurance-companies';
import { registerRoutersServicesUtilsProducers } from './producers';
import { registerRoutersServicesUtilsQuotes } from './quotes';
import { registerRoutersServicesUtilsReferral } from './referral';

function registerRoutersServicesUtils(server: Server) {
	registerRoutersServicesUtilsReferral(server);
	registerRoutersServicesUtilsAcceptInvitation(server);
	registerRoutersServicesUtilsQuotes(server);
	registerRoutersServicesUtilsProducers(server);
	registerRoutersServicesUtilsInsuranceCompanies(server);
	registerRoutersServicesUtilsDownloadApplication(server);
}

export { registerRoutersServicesUtils };
