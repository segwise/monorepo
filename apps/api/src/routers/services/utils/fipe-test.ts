import xior, { XiorError } from 'xior';
import type { Server } from '@/@types/server';
import { FipeService } from '@/controllers/fipe';
import { environment } from '@/libraries/environment';

const DAYS_IN_SECONDS = 24 * 60 * 60;

const CACHE_KEY = (plate: string) => `fipe-plates:${plate}`;

const fipeService = new FipeService(process.env.FIPE_TOKEN);

function registerRoutersServicesUtilsFipe(server: Server) {
	const base = server.basePath('/fipe');

	base.get('/:plate{^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$}', async (ctx) => {
		const plate = ctx.req.param('plate');

		const cacheName = CACHE_KEY(plate);

		try {
			// const isCache = await ctx.cache.exists(cacheName);

			// if (isCache) {
			// 	const data = JSON.parse((await ctx.cache.get(cacheName)) || '{}');

			// 	return ctx.json(data, 200);
			// }

			const { data } = await xior.get(
				`https://wdapi2.com.br/consulta/${plate}/${environment.APIPLACAS_TOKEN}`,
			);

			const [cars, motorcycles] = await Promise.all(
				['cars', 'motorcycles', 'trucks'].map((type) =>
					xior
						.get(`https://fipe.parallelum.com.br/api/v2/${type}/brands`)
						.then((response) => response.data),
				),
			);

			// @ts-expect-error
			const vehicleType = cars.find((response) =>
				response.name.toLowerCase().includes(data.marca.toLowerCase()),
			)
				? 'cars'
				: // @ts-expect-error
					motorcycles.find((response) =>
							response.name.toLowerCase().includes(data.marca),
						)
					? 'motorcycles'
					: 'trucks';

			const querySearch = {
				model: data.extra?.modelo || data.modelo,
				modelYear: Number(data.anoModelo),
				manufacturer: data.marca.toLowerCase(),
			};

			console.log(querySearch);
			const fipe = await fipeService.findByPlateData(querySearch, vehicleType);

			console.log(fipe);
			console.log(data.fipe, data.fipe.dados[0]?.codigo_fipe);

			// const response = {
			// 	code: data.fipe.dados[0]?.codigo_fipe,
			// 	plate,
			// 	manufacturer: data.marca,
			// 	model: data.fipe.dados?.[0]?.texto_modelo ?? data.modelo,
			// 	year: data.ano,
			// 	yearModel: data.anoModelo,
			// 	address: {
			// 		city: data.municipio,
			// 		uf: data.uf,
			// 	},
			// 	color: data.cor,
			// 	exchage: data.fipe.dados?.[0]?.texto_modelo.includes('Aut')
			// 		? 'Automático'
			// 		: 'Manual',
			// 	fuel: data.extra?.combustivel || 'Gasolina',
			// 	fipe: data.fipe.dados
			// 		.slice(0, 5)
			// 		.map(
			// 			({
			// 				ano_modelo,
			// 				texto_valor,
			// 				texto_modelo,
			// 				codigo_fipe,
			// 				combustivel,
			// 				score,
			// 			}) => ({
			// 				year: Number(ano_modelo),
			// 				value: Number(
			// 					texto_valor
			// 						.replace('R$ ', '')
			// 						.replace('.', '')
			// 						.replace(',', '.'),
			// 				),
			// 				model: texto_modelo.toLowerCase(),
			// 				code: codigo_fipe,
			// 				fuel: combustivel.toLowerCase() || 'Gasolina',
			// 				reference: new Date(),
			// 				score,
			// 			}),
			// 		),
			// 	chassi: data.chassi,
			// };

			// await ctx.cache.set(
			// 	cacheName,
			// 	JSON.stringify(response),
			// 	'EX',
			// 	DAYS_IN_SECONDS,
			// );

			// return ctx.json(response, 200);

			return ctx.json({}, 200);
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
