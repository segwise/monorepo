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
import { registerRoutersServicesPIX } from './pix';
import { registerRoutersServicesQuoteFinancing } from './quote-financing';
import { registerRoutersServicesWebhooks } from './webhooks';

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

	registerRoutersServicesWebhooks(base);

	base.get('/test', async (ctx) => {
		const results = await ctx.database.safe.findMany({
			where: {
				safeVehicle: {
					plate: {
						not: null,
					},
				},
			},
			select: {
				id: true,
				safeVehicle: {
					select: {
						plate: true,
					},
				},
			},
		});

		for (const result of results) {
			const index = results.indexOf(result);

			await ctx.database.safe.update({
				where: {
					id: result.id,
				},
				data: {
					safeVehicle: {
						update: {
							plate: result.safeVehicle?.plate?.toLowerCase().replace('-', ''),
						},
					},
				},
			});

			console.log(results.length, index);
		}

		return ctx.json(
			{
				ok: true,
			},
			200,
		);
	});
}

export { registerRoutersServices };
