import { SchemaName } from '@segwise/core/schemas';
import { capitalizeFirstLetters, sortArray } from '@segwise/core/utils';
import z from 'zod';
import type { Server } from '@/@types/server.d';

function registerRoutersProfessionsListining(server: Server) {
	server.get('/simple', async (ctx) => {
		const response = await fetch(
			'https://rnds-fhir.saude.gov.br/CodeSystem-BRCBO.json',
			{
				headers: {
					'Content-Type': 'json/application',
				},
			},
		);

		if (!response.ok) {
			return ctx.json(
				{
					message: 'Falha ao consultar lista de profissões no Gov.BR',
				},
				400,
			);
		}

		const data = (
			(await response.json()) as {
				concept: Array<{
					code: string;
					display: string;
				}>;
			}
		).concept
			.map(({ code, display }) => ({
				code,
				name: capitalizeFirstLetters(display),
			}))
			.map((value) =>
				z
					.object({
						code: z.string('Código inválido').min(1, 'Código inválido'),
						name: SchemaName,
					})
					.parse(value),
			);

		const collator = new Intl.Collator('pt-BR', {
			sensitivity: 'base',
			numeric: true,
			caseFirst: 'false',
		});

		const professionsSort = sortArray(data, (a, b) =>
			collator.compare(a.name, b.name),
		);

		return ctx.json(professionsSort, 200);
	});
}

export { registerRoutersProfessionsListining };
