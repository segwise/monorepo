import type { Server } from '@/@types/server';
import { requireSession } from '@/server/middlewares/session';
import { registerRoutersServicesMarketingCampaigns } from './campaigns';
import { registerRoutersServicesMarketingContacts } from './contacts';
import { registerRoutersServicesMarketingPrintContacts } from './print-contacts';
import { registerRoutersServicesMarketingQueues } from './queues';

function registerRoutersServicesMarketing(server: Server) {
	const base = server.basePath('/marketing');

	base.use(requireSession);

	registerRoutersServicesMarketingCampaigns(base);
	registerRoutersServicesMarketingContacts(base);
	registerRoutersServicesMarketingPrintContacts(base);
	registerRoutersServicesMarketingQueues(base);
}

export { registerRoutersServicesMarketing };
