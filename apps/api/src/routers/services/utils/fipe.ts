import { parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import xior, { XiorError } from 'xior';
import type { Server } from '@/@types/server';
import { environment } from '@/libraries/environment';

const CACHE_KEY = (plate: string) => `fipe-plates:${plate}`;

function registerRoutersServicesUtilsFipe(server: Server) {
	const base = server.basePath('/fipe');

	base.get('/:plate{^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$}', async (ctx) => {
		const plate = ctx.req.param('plate').toLowerCase();

		const cacheName = CACHE_KEY(plate);

		try {
			const isCache = await ctx.cache.exists(cacheName);

			if (isCache) {
				const data = JSON.parse((await ctx.cache.get(cacheName)) || '{}');

				return ctx.json(data, 200);
			}

			const { data } = await xior.get<{
				codigo: number;
				msg: string;
				fipe: Array<{
					similaridade: string;
					correspondencia: string;
					marca: string;
					modelo: string;
					ano_modelo: number;
					codigo_fipe: string;
					codigo_marca: string;
					codigo_modelo: string;
					mes_referencia: string;
					combustivel: string;
					valor: string;
					desvalorizometro: string;
					unidade_valor: string;
				}>;
				informacoes_veiculo: {
					marca: string;
					modelo: string;
					ano: string;
					ano_modelo: string;
					cor: string;
					chassi: string;
					motor: string;
					municipio: string;
					uf: string;
					segmento: string;
					sub_segmento: string;
					placa: string;
					cilindradas: string;
					combustivel: string;
				};
			}>(
				`https://api.placafipe.com.br/getplacafipe/${plate}/${environment.PLACA_FIPE_TOKEN}`,
			);

			const fipe = data.fipe.sort(
				(a, b) => Number(a.similaridade) - Number(b.similaridade),
			)[0];

			const response = {
				code: fipe?.codigo_fipe,
				plate,
				manufacturer: data.informacoes_veiculo.marca,
				model: fipe?.modelo,
				year: data.informacoes_veiculo.ano,
				yearModel: data.informacoes_veiculo.ano_modelo,
				address: {
					city: data.informacoes_veiculo.municipio,
					uf: data.informacoes_veiculo.uf,
				},
				color: data.informacoes_veiculo.cor,
				exchage:
					fipe?.modelo.toLowerCase().includes('automático') ||
					fipe?.modelo.toLowerCase().includes('automatico') ||
					fipe?.modelo.toLowerCase().includes('auto.') ||
					fipe?.modelo.toLowerCase().includes('aut.')
						? 'Automático'
						: 'Manual',
				fuel: data.informacoes_veiculo.combustivel,
				fipe: data.fipe
					.sort((a, b) => Number(a.similaridade) - Number(b.similaridade))
					.map(
						({
							ano_modelo,
							valor,
							modelo,
							codigo_fipe,
							combustivel,
							mes_referencia,
						}) => ({
							year: Number(ano_modelo),
							value: Number(
								valor.replace('R$ ', '').replace('.', '').replace(',', '.'),
							),
							model: modelo.toLowerCase(),
							code: codigo_fipe,
							fuel: combustivel.toLowerCase(),
							reference: parse(mes_referencia, "MMMM 'de' yyyy", new Date(), {
								locale: ptBR,
							}),
							score: 0,
						}),
					),
				chassi: data.informacoes_veiculo.chassi,
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
