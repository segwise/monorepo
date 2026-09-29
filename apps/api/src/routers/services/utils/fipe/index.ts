import { parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import xior, { XiorError } from 'xior';
import type { Server } from '@/@types/server';
import { environment } from '@/libraries/environment';
import { type FipeCandidate, rankFipeCandidates } from './vehicle-matcher';

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
				fipe: FipeCandidate[];
				informacoes_veiculo: {
					marca: string;
					modelo: string;
					ano: string | null;
					ano_modelo: string;
					cor: string;
					chassi: string;
					motor: string;
					municipio: string | null;
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

			const { ranked: fipe, strategy } = rankFipeCandidates(
				data.informacoes_veiculo.modelo,
				data.fipe,
			);

			const best = fipe[0];

			const response = {
				code: best?.codigo_fipe,
				plate,
				manufacturer: data.informacoes_veiculo.marca,
				model: best?.modelo,
				year: Number(
					data.informacoes_veiculo?.ano || data.informacoes_veiculo.ano_modelo,
				),
				yearModel: data.informacoes_veiculo.ano_modelo,
				address: {
					city: data.informacoes_veiculo?.municipio ?? '',
					uf: data.informacoes_veiculo.uf,
				},
				color: data.informacoes_veiculo.cor,
				exchage:
					best?.modelo.toLowerCase().includes('automático') ||
					best?.modelo.toLowerCase().includes('automatico') ||
					best?.modelo.toLowerCase().includes('auto.') ||
					best?.modelo.toLowerCase().includes('aut.')
						? 'Automático'
						: 'Manual',
				fuel: data.informacoes_veiculo.combustivel,
				matchStrategy: strategy,
				fipe: fipe.map(
					({
						ano_modelo,
						valor,
						modelo,
						codigo_fipe,
						combustivel,
						mes_referencia,
						score,
						matchedSignals,
					}) => ({
						year: Number(ano_modelo),
						value: Number.parseFloat(valor),
						model: modelo.toLowerCase(),
						code: codigo_fipe,
						fuel: combustivel.toLowerCase(),
						reference: parse(mes_referencia, "MMMM 'de' yyyy", new Date(), {
							locale: ptBR,
						}),
						score,
						matchedSignals,
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
