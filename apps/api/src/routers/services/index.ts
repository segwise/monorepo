import { subDays } from 'date-fns';
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

	base.post('/test', async (ctx) => {
		const signatures = await ctx.database.safe.findMany({
			where: {
				id: {
					notIn: [
						'019fb2eb-ffff-7652-91d2-0150953ea942',
						'019fb94d-be34-705f-9bf9-87b38aa493a4',
					],
				},
			},
			select: {
				id: true,
				expiration: true,
			},
		});

		console.log(signatures.length);
		for (const signature of signatures) {
			console.log(
				signatures.length,
				(signatures.findIndex(({ id }) => id === signature.id) ?? 0) + 1,
			);

			await ctx.database.safe.update({
				where: {
					id: signature.id,
				},
				data: {
					expiration: subDays(signature.expiration, 1),
				},
			});
		}

		console.log('Troca de datas concluída');

		return ctx.json(
			{
				ok: true,
			},
			200,
		);
	});
}

export { registerRoutersServices };
