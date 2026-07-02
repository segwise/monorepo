import type { Server } from '@/@types/server.d';
import { registerRoutersServicesAnalytics } from '@/routers/services/analytics';
import { registerRoutersServicesAuth } from '@/routers/services/auth';
import { registerRoutersServicesCpfOrCnpj } from '@/routers/services/cpf-or-cnpj';
import { registerRoutersServicesPayments } from '@/routers/services/payments';
import { registerRoutersServicesProducers } from '@/routers/services/producers';
import { registerRoutersServicesQuotes } from '@/routers/services/quotes';
import { registerRoutersServicesSafes } from '@/routers/services/safes';
import { registerRoutersServicesUtils } from '@/routers/services/utils';
import { registerRoutersServicesVehicles } from '@/routers/services/vehicles';
import { registerRoutersServicesMarketplace } from './marketplace';
import { registerRoutersServicesMigration } from './migration';
import { registerRoutersServicesPIX } from './pix';
import { registerRoutersServicesQuoteFinancing } from './quote-financing';

function registerRoutersServices(server: Server) {
	const base = server.basePath('/services');

	registerRoutersServicesAuth(base);
	registerRoutersServicesUtils(base);
	registerRoutersServicesQuoteFinancing(base);
	registerRoutersServicesMarketplace(base);

	registerRoutersServicesPIX(base);

	registerRoutersServicesVehicles(base);

	registerRoutersServicesSafes(base);

	registerRoutersServicesProducers(base);
	registerRoutersServicesCpfOrCnpj(base);
	registerRoutersServicesQuotes(base);
	registerRoutersServicesAnalytics(base);
	registerRoutersServicesPayments(base);

	registerRoutersServicesMigration(base);

	base.get('/', async (ctx) => {
		const results = await ctx.database.safe.findMany({
			where: {
				insured: {
					cpf: '06874064479',
				},
			},
			include: {
				insured: {
					select: {
						name: true,
						cpf: true,
					},
				},
			},
			relationLoadStrategy: 'join',
		});

		return ctx.json(results, 200);
	});
}

export { registerRoutersServices };
