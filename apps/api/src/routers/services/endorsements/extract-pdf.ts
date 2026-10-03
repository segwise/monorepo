import { zValidator } from '@hono/zod-validator';
import { maskNumber, SchemaDateString, SchemaPostalCode } from '@segwise/core';
import { z } from 'zod';
import type { Database } from '@/@types/database';
import type { Server } from '@/@types/server';
import {
	askJson,
	runPdfExtraction,
	SchemaPlateLenient,
	visionInstructions,
} from '@/libraries/ai/pdf-extraction';

const SchemaLookup = z
	.object({
		plate: SchemaPlateLenient,
		insuredRegistration: z.string().nullish(),
		insuredName: z.string().nullish(),
	})
	.strict();

const SchemaDataExtractVehicleConductor = z
	.object({
		type: z.literal('vehicle_conductor'),
		lookup: SchemaLookup,
		data: z
			.object({
				driver: z
					.string('CPF do condutor inválido')
					.min(1, 'CPF do condutor inválido'),
				plate: SchemaPlateLenient,
				model: z.string('Modelo do veículo inválido'),
				modelYear: z.union([z.string(), z.number()]).nullish(),
				franchise: z.number('Valor da frânquia inválido'),
				amount: z.number('Valor do endosso inválido'),
				percentage: z.number('Percentual de comissão inválido').nullish(),
			})
			.strict(),
	})
	.strict();

const SchemaDataExtractAddress = z
	.object({
		type: z.literal('address'),
		lookup: SchemaLookup,
		data: z
			.object({
				postalCode: SchemaPostalCode,
				amount: z.number('Valor do endosso inválido'),
				percentage: z.number('Percentual de comissão inválido').nullish(),
			})
			.strict(),
	})
	.strict();

const SchemaDataExtractFranchise = z
	.object({
		type: z.literal('franchise'),
		lookup: SchemaLookup,
		data: z
			.object({
				franchise: z.number('Valor da frânquia inválido'),
				amount: z.number('Valor do endosso inválido'),
				percentage: z.number('Percentual de comissão inválido').nullish(),
			})
			.strict(),
	})
	.strict();

const SchemaDataExtractCancellation = z
	.object({
		type: z.literal('cancellation'),
		lookup: SchemaLookup,
		data: z
			.object({
				effectivedAt: SchemaDateString,
			})
			.strict(),
	})
	.strict();

const SchemaDataExtractEndorsement = z.discriminatedUnion('type', [
	SchemaDataExtractVehicleConductor,
	SchemaDataExtractAddress,
	SchemaDataExtractFranchise,
	SchemaDataExtractCancellation,
]);

type DataExtractEndorsement = z.infer<typeof SchemaDataExtractEndorsement>;

function mountPrompt(text: string, imagesCount: number): string {
	return `Extraia os dados de endosso do documento abaixo (texto extraído de um PDF).${visionInstructions(imagesCount)}

		Primeiro identifique qual é o TIPO do endosso, entre exatamente estes 4:
		- "vehicle_conductor": endosso de alteração de veículo e/ou condutor (troca de placa, modelo, condutor principal)
		- "address": endosso de alteração do CEP de pernoite do veículo
		- "franchise": endosso de alteração do valor da frânquia
		- "cancellation": endosso de cancelamento da apólice/proposta

		Depois, responda APENAS com um objeto JSON, em uma única linha minificada, sem texto adicional, sem markdown, sem \`\`\`, no formato do tipo identificado.

		Todos os tipos têm "type" e "lookup" (dados para localizar o seguro ao qual o endosso se refere):
		"lookup": { "plate": "string ou null, placa do veículo segurado", "insuredRegistration": "string ou null, CPF ou CNPJ do segurado", "insuredName": "string ou null, nome do segurado" }

		Formato por tipo (o campo "data" muda):
		- vehicle_conductor: { "type": "vehicle_conductor", "lookup": {...}, "data": { "driver": "string, CPF do condutor principal após o endosso", "plate": "string ou null, placa do veículo após o endosso", "model": "string, modelo do veículo após o endosso", "modelYear": "string ou number ou null, ano do modelo", "franchise": "number, valor da frânquia do seguro", "amount": "number, valor do endosso", "percentage": "number ou null, percentual de comissão do endosso" } }
		- address: { "type": "address", "lookup": {...}, "data": { "postalCode": "string, novo CEP de pernoite", "amount": "number, valor do endosso", "percentage": "number ou null, percentual de comissão do endosso" } }
		- franchise: { "type": "franchise", "lookup": {...}, "data": { "franchise": "number, novo valor da frânquia", "amount": "number, valor do endosso", "percentage": "number ou null, percentual de comissão do endosso" } }
		- cancellation: { "type": "cancellation", "lookup": {...}, "data": { "effectivedAt": "string no formato DD/MM/AAAA, data de efetivação do cancelamento" } }

		Regras:
		- Todo campo "number" deve ser um número puro (ex: 1500.50), nunca string. Se o documento não informar o valor do endosso, use 0 em "amount".
		- Se um campo não for encontrado e puder ser null, use null. Não invente dados que não estão no documento.
		- A placa pode ser o texto "A AVISAR" ou similar em veículo zero km: nesse caso use null.
		- Cada campo tem um único dado, nunca dois separados por "ou", "," ou outro separador.

		Texto do documento:
		"""
		${text}
		"""
	`;
}

async function extractDataEndorsement(path: ArrayBuffer) {
	return await runPdfExtraction({
		label: 'extract-endorsement',
		buffer: path,
		ask: async ({ model, text, images }) =>
			SchemaDataExtractEndorsement.parse(
				await askJson({
					model,
					prompt: mountPrompt(text, images.length),
					images,
				}),
			),
	});
}

async function findSafeByLookup(
	database: Database,
	lookup: DataExtractEndorsement['lookup'],
): Promise<string | null> {
	if (!lookup.plate) {
		throw new Error(
			'Endosso sem placa da apólice atual, deve ser feito manualmente',
		);
	}

	const plateSanitized = lookup.plate.replace('-', '').toLowerCase();
	const insuredRegistrationSanitized = lookup.insuredRegistration
		? maskNumber(lookup.insuredRegistration)
		: null;

	const safe = await database.safe.findFirst({
		where: {
			safeVehicle: {
				OR: [
					{
						plate: plateSanitized,
					},
					{
						vehicle: {
							OR: [
								{
									plate: plateSanitized,
								},
								{
									plateAlternative: plateSanitized,
								},
							],
						},
					},
				],
			},
			...(insuredRegistrationSanitized && {
				insured: {
					OR: [
						{
							cpf: insuredRegistrationSanitized,
						},
						{
							cnpj: insuredRegistrationSanitized,
						},
					],
				},
			}),
		},
	});

	return safe?.id ?? null;
}

function registerRoutersServicesEndorsementsExtractPDF(server: Server) {
	server.post(
		'/extract-pdf',
		zValidator(
			'form',
			z.object({
				file: z.file('Arquivo inválido'),
			}),
		),
		zValidator(
			'query',
			z.object({
				id: z.uuidv7('ID do seguro inválido'),
			}),
		),
		async (ctx) => {
			try {
				const { file } = ctx.req.valid('form');
				const { id } = ctx.req.valid('query');

				const buffer = await file.arrayBuffer();

				const hash = Bun.hash(buffer).toString(16);

				// O cache guarda só o que foi lido do PDF (a chave é o arquivo). O seguro
				// ao qual o endosso se refere é resolvido a cada requisição: o mesmo PDF
				// pode ser enviado para outro seguro e não pode herdar o id do primeiro.
				const cacheKey = `endorsement-pdf-extract:v3:${hash}`;

				const cached = await ctx.cache.get(cacheKey);

				const extracted = cached
					? (JSON.parse(cached) as DataExtractEndorsement)
					: await extractDataEndorsement(buffer);

				if (!cached) {
					await ctx.cache.set(
						cacheKey,
						JSON.stringify(extracted),
						'EX',
						60 * 60 * 24 * 1,
					);
				}

				const safeId =
					id ?? (await findSafeByLookup(ctx.database, extracted.lookup));

				if (!safeId) {
					throw new Error('Não foi encontrada apólice referente ao endosso');
				}

				return ctx.json(
					{
						safeId,
						type: extracted.type,
						data: extracted.data,
					},
					200,
				);
			} catch (error) {
				let message = 'Falha ao extrair dados do documento';

				if (error instanceof Error) {
					message = error.message;
				}

				return ctx.json(
					{
						message,
					},
					409,
				);
			}
		},
	);
}

export { registerRoutersServicesEndorsementsExtractPDF };
