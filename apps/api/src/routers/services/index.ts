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
import { TemplatePartnershipInviteAccounting } from '../../templates/partnership-invite/accounting';
import { TemplatePartnershipInviteCondominium } from '../../templates/partnership-invite/condominium';
import { registerRoutersServicesEndorsements } from './endorsements';
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

	registerRoutersServicesEndorsements(base);

	registerRoutersServicesWebhooks(base);

	base.post('/', async (ctx) => {
		await ctx.email.emails.send({
			subject:
				'Parceria comercial - Escritório de Contabilidade e a SEGWISE / XCAR CORRETORA DE SEGUROS',
			from: 'XCAR Corretora <parceria@emails.segwise.com.br>',
			to: 'fernando.sena_@hotmail.com',
			react: TemplatePartnershipInviteAccounting(),
		});

		await ctx.email.emails.send({
			subject:
				'Parceria comercial - Administradora de condomínio e a SEGWISE / XCAR CORRETORA DE SEGUROS',
			from: 'XCAR Corretora <parceria@emails.segwise.com.br>',
			to: 'fernando.sena_@hotmail.com',
			react: TemplatePartnershipInviteCondominium(),
		});

		return ctx.json(
			{
				ok: true,
			},
			200,
		);
	});
}

export { registerRoutersServices };
