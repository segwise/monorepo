import { SchemaName } from '@segwise/core/schemas';
import { capitalizeFirstLetters, sortArray } from '@segwise/core/utils';
import xior, { XiorError } from 'xior';
import z from 'zod';
import type { Server } from '@/@types/server.d';

const KEY_CACHE = 'professions';

function registerRoutersServicesProfessionsListining(server: Server) {
	server.get('/simple', async (ctx) => {
		try {
			const cache = await ctx.cache.exists(KEY_CACHE);

			if (cache) {
				const data = await ctx.cache.get(KEY_CACHE);

				if (!data) {
					throw new Error('Falha na consulta do cache');
				}

				return ctx.json(JSON.parse(data), 200);
			}

			const { data: professions } = await xior.get<{
				concept: Array<{
					code: string;
					display: string;
				}>;
			}>('https://rnds-fhir.saude.gov.br/CodeSystem-BRCBO.json');

			const data = professions.concept
				.map(({ code, display }) => ({
					code,
					name: display,
				}))
				.map((value) =>
					z
						.object({
							code: z.string('Código inválido').min(1, 'Código inválido'),
							name: SchemaName,
						})
						.parse(value),
				)
				.map((response) => ({
					...response,
					name: capitalizeFirstLetters(response.name),
				}));

			const collator = new Intl.Collator('pt-BR', {
				sensitivity: 'base',
				numeric: true,
				caseFirst: 'false',
			});

			const professionsSort = sortArray(data, (a, b) =>
				collator.compare(a.name, b.name),
			);

			await ctx.cache.set(
				KEY_CACHE,
				JSON.stringify(professionsSort),
				'EX',
				60 * 60 * 24,
			);

			return ctx.json(professionsSort, 200);
		} catch (error) {
			let message = 'Ocorreu algum error';

			if (error instanceof XiorError) {
				const messageResponse = error.response?.data.message;

				if (messageResponse) {
					message = messageResponse;
				}
			}

			return ctx.json(
				{
					message,
				},
				500,
			);
		}
	});
}

export { registerRoutersServicesProfessionsListining };
