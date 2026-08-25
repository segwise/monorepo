import { type Browser, chromium } from 'playwright';
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
import { registerRoutersEmails } from './emails';
import { registerRoutersServicesEndorsements } from './endorsements';
import { registerRoutersServicesMarketplace } from './marketplace';
import { registerRoutersServicesPIX } from './pix';
import { registerRoutersServicesQuoteFinancing } from './quote-financing';
import { registerRoutersServicesWebhooks } from './webhooks';

let browserInstance: Browser | null = null;

async function getBrowser() {
	if (!browserInstance) {
		browserInstance = await chromium.launch();
	}

	return browserInstance;
}

async function gerarPdfDaRota(url: string): Promise<Buffer> {
	const browser = await getBrowser();
	const page = await browser.newPage();

	try {
		await page.goto(url, { waitUntil: 'networkidle' });

		return await page.pdf({
			format: 'A4',
			printBackground: true,
			margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
		});
	} finally {
		await page.close();
	}
}

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

	registerRoutersEmails(base);

	base.get('/accounting', async (ctx) => {
		return ctx.html(TemplatePartnershipInviteAccounting());
	});

	base.get('/condominium', async (ctx) => {
		return ctx.html(TemplatePartnershipInviteCondominium());
	});

	base.get('/accounting/pdf', async (ctx) => {
		const url = new URL('/accounting', ctx.req.url).toString();

		const pdfBuffer = await gerarPdfDaRota(url);

		return new Response(pdfBuffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': 'inline; filename="parceria-contabilidade.pdf"',
			},
		});
	});

	base.get('/condominium/pdf', async (ctx) => {
		const url = new URL('/condominium', ctx.req.url).toString();

		const pdfBuffer = await gerarPdfDaRota(url);

		return new Response(pdfBuffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': 'inline; filename="parceria-condominio.pdf"',
			},
		});
	});
}

export { registerRoutersServices };
