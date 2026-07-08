import xior from 'xior';
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
		const assistance_contacts = [
			{
				name: 'akad seguros a.a',
				image:
					'https://akadseguros.com.br/content/uploads/2023/07/logo-icone-rosa-akad.png',
				short_name: 'AKAD Seguradora',
				registration: '14868712000131',
				created_at: '2023-12-05T02:38:46.183Z',
				assistance_contacts: [
					{
						description: 'central 24h',
						contacts: [
							{
								value: '551151962523',
								whatsapp: true,
								region: 'all_regions',
							},
							{
								value: '08007772746',
								whatsapp: true,
								region: 'all_regions',
							},
						],
					},
					{
						description: 'assistências e sinistros',
						contacts: [
							{
								value: '08009422746',
								whatsapp: null,
								region: 'all_regions',
							},
						],
					},
					{
						description: 'sac',
						contacts: [
							{
								value: '40001246',
								whatsapp: null,
								region: 'all_regions',
							},
						],
					},
				],
			},
		];

		for (const insurance of assistance_contacts) {
			const idInsurance = Bun.randomUUIDv7();

			const pathInsurance: string = `/insurance-companies/${idInsurance}`;

			const { data } = await xior
				.get(insurance.image, {
					responseType: 'blob',
				})
				.catch(() => ({
					data: 'error',
				}));

			await ctx.storage.images.write(pathInsurance as string, data);

			const company = await ctx.database.insuranceCompany.create({
				data: {
					id: idInsurance,
					name: insurance.name,
					icon: pathInsurance,
					cnpj: insurance.registration,
				},
				select: {
					id: true,
				},
			});

			let categoryInt = 0;

			for (const item of insurance.assistance_contacts) {
				const category =
					await ctx.database.insuranceCompanyCategoryContact.create({
						data: {
							index: categoryInt++,
							label: item.description,
							insuranceCompany: {
								connect: {
									id: company.id,
								},
							},
						},
						select: {
							id: true,
						},
					});

				const contacts = insurance.assistance_contacts
					.filter((e) => e.description === item.description)
					.map((e) => e.contacts);

				for (const group of contacts) {
					let categoryContactInt = 0;

					for (const { region, whatsapp, value } of group) {
						await ctx.database.insuranceCompanyContact.create({
							data: {
								index: categoryContactInt++,
								coverage:
									region === 'all_regions'
										? 'all_regions'
										: 'capitals_and_metropolitan_regions',
								isWhatsapp: !!whatsapp,
								value,
								category: {
									connect: {
										id: category.id,
									},
								},
							},
						});
					}
				}
			}
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
