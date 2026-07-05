import { parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import xior, { XiorError } from 'xior';
import type { Server } from '@/@types/server';
import { bestMatch, FipeService } from '@/controllers/fipe';
import { environment } from '@/libraries/environment';

const fipeService = new FipeService();

const CACHE_KEY = (plate: string) => `fipe-plates:${plate}`;

function registerRoutersServicesUtilsFipe(server: Server) {
	const base = server.basePath('/fipe');

	base.get('/:plate{^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$}', async (ctx) => {
		const plate = ctx.req.param('plate');

		const cacheName = CACHE_KEY(plate);

		try {
			const isCache = await ctx.cache.exists(cacheName);

			if (isCache) {
				const data = JSON.parse((await ctx.cache.get(cacheName)) || '{}');

				return ctx.json(data, 200);
			}

			const { data } = await xior.get(
				`https://wdapi2.com.br/consulta/${plate}/${environment.APIPLACAS_TOKEN}`,
			);

			if (data?.detail?.toLowerCase().includes('erro')) {
				throw new Error(data.detail);
			}

			const [cars, motorcycles] = await Promise.all(
				['cars', 'motorcycles', 'trucks'].map((type) =>
					xior
						.get(`https://fipe.parallelum.com.br/api/v2/${type}/brands`)
						.then((response) => response.data),
				),
			);

			let brand = data.marca.toLowerCase();

			if (brand === 'chev') {
				brand = 'chevrolet';
			}

			const vehicleType = bestMatch(motorcycles, brand)
				? 'motorcycles'
				: bestMatch(cars, brand)
					? 'cars'
					: 'trucks';

			const querySearch = {
				model: `${data?.extra?.modelo ?? data.modelo} `
					.replaceAll('/', ' / ')
					.replaceAll(' 10 ', ' 1.0 ')
					.replaceAll(' 14 ', ' 1.4 ')
					.replaceAll(' 16 ', ' 1.6 ')
					.replaceAll(' 24 ', ' 2.4 ')
					.replaceAll(' 25 ', ' 2.5 ')
					.replaceAll(' 30 ', ' 3.0 ')
					.toLowerCase()
					.trim(),
				modelYear: Number(data.anoModelo),
				manufacturer: brand,
			};

			const fipe = await fipeService.findByPlateData(querySearch, vehicleType);

			const response = {
				code: data.fipe.dados[0]?.codigo_fipe,
				plate,
				manufacturer: data.marca,
				model: fipe?.details?.[0]?.model.toLowerCase() ?? querySearch.model,
				year: data.ano,
				yearModel: data.anoModelo,
				address: {
					city: data.municipio,
					uf: data.uf,
				},
				color: data.cor,
				exchage:
					data.fipe.dados?.[0]?.texto_modelo
						.toLowerCase()
						.includes('automático') ||
					data.fipe.dados?.[0]?.texto_modelo
						.toLowerCase()
						.includes('automatico') ||
					data.fipe.dados?.[0]?.texto_modelo.toLowerCase().includes('auto.') ||
					data.fipe.dados?.[0]?.texto_modelo.toLowerCase().includes('aut.')
						? 'Automático'
						: 'Manual',
				fuel: data.extra?.combustivel || 'Gasolina',
				fipe: fipe.details.map(
					({ modelYear, price, model, codeFipe, fuel, referenceMonth }) => ({
						year: Number(modelYear),
						value: Number(
							price.replace('R$ ', '').replace('.', '').replace(',', '.'),
						),
						model: model.toLowerCase(),
						code: codeFipe,
						fuel: fuel.toLowerCase() || 'Gasolina',
						reference: parse(referenceMonth, "MMMM 'de' yyyy", new Date(), {
							locale: ptBR,
						}),
						score: 0,
					}),
				),
				chassi: data.chassi,
			};

			await ctx.cache.set(
				cacheName,
				JSON.stringify(response),
				'EX',
				60 * 60 * 24,
			);

			return ctx.json(response, 200);
		} catch (error) {
			let message = 'Falha ao consultar a placa';

			if (error instanceof XiorError) {
				if (error.response?.data.message) {
					message = error.response?.data.message;
				}
			}

			if (error instanceof Error) {
				if (error.message) {
					message = error.message;
				}
			}

			return ctx.json(
				{
					message,
				},
				200,
			);
		}
	});
}

export { registerRoutersServicesUtilsFipe };
