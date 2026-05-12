import xior, { XiorError } from 'xior';
import type { Server } from '@/@types/server';

type VehicleResponse = {
	MARCA: string;
	MODELO: string;
	SUBMODELO: string;
	VERSAO: string;
	ano: string;
	anoModelo: string;
	chassi: string;
	codigoSituacao: string;
	cor: string;
	data: string;
	extra?: {
		ano_fabricacao: string;
		ano_modelo: string;
		caixa_cambio: string;
		cap_maxima_tracao: string;
		carroceria: string;
		chassi?: string | null;
		cilindradas: string;
		combustivel: string;
		di: string;
		eixo_traseiro_dif: string;
		eixos: string;
		especie: string;
		grupo: string;
		modelo: string;
		municipio: string;
		nacionalidade: string;
		peso_bruto_total: string;
		placa: string;
		placa_modelo_antigo: string;
		placa_modelo_novo: string;
		quantidade_passageiro: string;
		's.especie': string;
		segmento: string;
		situacao_chassi: string;
		situacao_veiculo: string;
		sub_segmento: string;
		terceiro_eixo: string;
		tipo_carroceria: string;
		tipo_doc_faturado: string;
		tipo_doc_importadora: string;
		tipo_doc_prop: string;
		tipo_montagem: string;
		tipo_veiculo: string;
		uf: string;
		uf_faturado: string;
		uf_placa: string;
	} | null;
	fipe: {
		dados: Array<{
			ano_modelo: string;
			codigo_fipe: string;
			codigo_marca: number;
			codigo_modelo: string;
			combustivel: string;
			id_valor: number;
			mes_referencia: string;
			referencia_fipe: number;
			score: number;
			sigla_combustivel: string;
			texto_marca: string;
			texto_modelo: string;
			texto_valor: string;
			tipo_modelo: number;
		}>;
	};
	listamodelo: Array<string>;
	logo: string;
	marca: string;
	marcaModelo: string;
	mensagemRetorno: string;
	modelo: string;
	municipio: string;
	origem: string;
	placa: string;
	placa_alternativa: string;
	situacao: string | null;
	token: string;
	uf: string;
};

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

			const { data } = await xior.get<VehicleResponse>(
				`https://wdapi2.com.br/consulta/${plate}/${ctx.environment.APIPLACAS_TOKEN}`,
			);

			const response = {
				code: data.fipe.dados[0]?.codigo_fipe,
				plate,
				manufacturer: data.marca,
				model: data.fipe.dados?.[0]?.texto_modelo ?? data.modelo,
				year: data.ano,
				yearModel: data.anoModelo,
				address: {
					city: data.municipio,
					uf: data.uf,
				},
				color: data.cor,
				exchage: data.fipe.dados?.[0]?.texto_modelo.includes('Aut')
					? 'Automático'
					: 'Manual',
				fuel: data.extra?.combustivel || 'Gasolina',
				fipe: data.fipe.dados
					.slice(0, 5)
					.map(
						({
							ano_modelo,
							texto_valor,
							texto_modelo,
							codigo_fipe,
							combustivel,
							score,
						}) => ({
							year: Number(ano_modelo),
							value: Number(
								texto_valor
									.replace('R$ ', '')
									.replace('.', '')
									.replace(',', '.'),
							),
							model: texto_modelo.toLowerCase(),
							code: codigo_fipe,
							fuel: combustivel.toLowerCase() || 'Gasolina',
							reference: new Date(),
							score,
						}),
					),
				chassi: data.chassi,
			};

			await ctx.cache.set(cacheName, JSON.stringify(response));

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
