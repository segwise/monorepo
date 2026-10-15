import { zValidator } from '@hono/zod-validator';
import { SchemaBrazilianState } from '@segwise/core/schemas';
import xior from 'xior';
import z from 'zod';
import type { Server } from '@/@types/server';

// Municípios por UF (IBGE). A lista quase não muda, então fica no Redis por 30
// dias e o IBGE só é consultado na primeira vez de cada estado (ou depois que
// a chave expira). `volatile-lru` do cache só expulsa chaves com TTL, e esta
// tem.
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
const CACHE_KEY = (uf: string) => `ibge:cities:${uf}`;

// Várias requisições simultâneas do mesmo estado compartilham uma única
// chamada ao IBGE.
const inflight = new Map<string, Promise<string[]>>();

async function fetchFromIbge(uf: string) {
	const { data } = await xior.get<Array<{ nome: string }>>(
		`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
		{ params: { orderBy: 'nome' }, timeout: 15000 },
	);

	return data.map((city) => city.nome);
}

function registerRoutersServicesUtilsCities(server: Server) {
	server.get(
		'/cities',
		zValidator('query', z.object({ uf: SchemaBrazilianState })),
		async (ctx) => {
			const { uf } = ctx.req.valid('query');
			const key = CACHE_KEY(uf);

			// Navegador também pode guardar: a resposta é igual para todos.
			ctx.header('Cache-Control', 'private, max-age=86400');

			const cached = await ctx.cache.get(key);

			if (cached) {
				return ctx.json(JSON.parse(cached) as string[], 200);
			}

			try {
				let request = inflight.get(uf);

				if (!request) {
					request = fetchFromIbge(uf).finally(() => inflight.delete(uf));
					inflight.set(uf, request);
				}

				const cities = await request;

				if (cities.length) {
					await ctx.cache.set(
						key,
						JSON.stringify(cities),
						'EX',
						CACHE_TTL_SECONDS,
					);
				}

				return ctx.json(cities, 200);
			} catch {
				ctx.header('Cache-Control', 'no-store');

				return ctx.json({ message: 'Falha ao consultar cidades' }, 502);
			}
		},
	);
}

export { registerRoutersServicesUtilsCities };
