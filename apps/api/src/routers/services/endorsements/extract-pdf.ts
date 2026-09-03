import { zValidator } from '@hono/zod-validator';
import {
	maskNumber,
	SchemaDateString,
	SchemaPlate,
	SchemaPostalCode,
} from '@segwise/core';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';
import { z } from 'zod';
import type { Database } from '@/@types/database';
import type { Server } from '@/@types/server';

const AI_BASE_URL = process.env.AI_BASE_URL as string;
const AI_MODEL = process.env.AI_MODEL as string;
const AI_API_KEY = process.env.AI_API_KEY as string;

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30_000;

const clientOpenAI = new OpenAI({
	baseURL: AI_BASE_URL,
	apiKey: AI_API_KEY,
	timeout: REQUEST_TIMEOUT_MS,
});

const SchemaLookup = z
	.object({
		plate: SchemaPlate.nullish(),
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
				plate: SchemaPlate.nullish(),
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

async function extractTextToPDF(buffer: ArrayBuffer): Promise<string> {
	const parser = new PDFParse({ data: Buffer.from(buffer) });

	const result = await parser.getText();

	const text = result.text;

	if (text.length === 0) {
		throw new Error(
			'PDF não retornou texto extraível — pode ser um scan/imagem. Necessário OCR.',
		);
	}

	return text;
}

function sanitizeText(text: string): string {
	return (
		text
			// biome-ignore lint/suspicious/noControlCharactersInRegex: regex
			.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
			.replace(/\r\n/g, '\n')
			.replace(/\n{3,}/g, '\n\n')
	);
}

function chunkText(text: string, maxChars = 24_000): string {
	const clean = sanitizeText(text);

	if (clean.length <= maxChars) {
		return clean;
	}

	return clean.slice(0, maxChars);
}

function mountPrompt(text: string): string {
	return `Extraia os dados de endosso do texto abaixo, extraído de um PDF.

		Primeiro identifique qual é o TIPO do endosso, entre exatamente estes 4:
		- "vehicle_conductor": endosso de alteração de veículo e/ou condutor (troca de placa, modelo, condutor principal)
		- "address": endosso de alteração do CEP de pernoite do veículo
		- "franchise": endosso de alteração do valor da frânquia
		- "cancellation": endosso de cancelamento da apólice/proposta

		Depois, responda APENAS com um objeto JSON no formato exato correspondente ao tipo identificado, sem texto adicional, sem markdown, sem \`\`\`.

		Todo tipo de endosso deve incluir também o campo "lookup", usado apenas para localizar o seguro no sistema (não faz parte dos dados do endosso em si):
		{
			"lookup": {
				"plate": "string ou null, a placa ATUAL do veículo já vinculada ao seguro/apólice existente — é a placa que identifica qual seguro está sendo endossado, NUNCA a nova placa informada em um endosso de troca de veículo. Se o seguro foi contratado para um veículo sem placa (e este documento está justamente adicionando uma placa pela primeira vez), retorne null aqui, pois não existe placa atual",
				"insuredRegistration": "string ou null, CPF ou CNPJ do segurado/proponente da apólice",
				"insuredName": "string ou null, nome completo do segurado/proponente da apólice"
			}
		}

		Se o tipo for "vehicle_conductor":
		{
			"type": "vehicle_conductor",
			"lookup": { ... },
			"data": {
				"driver": "string, CPF do condutor principal, apenas números ou formatado, o que estiver no documento",
				"plate": "string ou null, a NOVA placa do veículo definida por este endosso. Retorne null quando o endosso for de veículo sem placa, ou quando a placa não estiver mudando",
				"model": "string, modelo do veículo",
				"modelYear": "string ou number ou null, ano do modelo do veículo",
				"franchise": "number, valor da frânquia do endosso",
				"amount": "number, valor do endosso",
				"percentage": "number ou null, percentual de comissão do endosso, se informado"
			}
		}

		Se o tipo for "address":
		{
			"type": "address",
			"lookup": { ... },
			"data": {
				"postalCode": "string, novo CEP de pernoite do veículo",
				"amount": "number, valor do endosso",
				"percentage": "number ou null, percentual de comissão do endosso, se informado"
			}
		}

		Se o tipo for "franchise":
		{
			"type": "franchise",
			"lookup": { ... },
			"data": {
				"franchise": "number, novo valor da frânquia",
				"amount": "number, valor do endosso",
				"percentage": "number ou null, percentual de comissão do endosso, se informado"
			}
		}

		Se o tipo for "cancellation":
		{
			"type": "cancellation",
			"lookup": { ... },
			"data": {
				"effectivedAt": "string no formato DD/MM/AAAA, data de efetivação do cancelamento"
			}
		}

		Regras:
		- Se algum campo opcional não for encontrado, use null.
		- Todo resultado que é especificado como tipo "number" deve ser um número puro (ex: 1500.50), nunca string.
		- Não invente dados que não estão no texto.
		- Nenhum campo pode ter mais de um dado, é sempre um único dado, nunca dois dados no mesmo campo separado por "ou", ",", ou algum outro tipo de separador.
		- Retorne SOMENTE o objeto correspondente ao tipo identificado — nunca misture campos de tipos diferentes, e nunca inclua o campo "type" fora do nível raiz.
		- O campo "lookup" é sempre obrigatório em todo tipo de endosso, mesmo que todos os seus subcampos sejam null.
		- É extremamente importante não confundir "lookup.plate" (a placa ATUAL, que já está na apólice) com "data.plate" do tipo vehicle_conductor (a NOVA placa que o endosso está definindo) — são conceitos diferentes, mesmo quando o documento só menciona uma placa.

		Texto do documento:
		"""
		${text}
		"""
	`;
}

async function extractToAI(text: string): Promise<DataExtractEndorsement> {
	const textChunk = chunkText(text);

	let lastError: unknown;

	for (let retry = 1; retry <= MAX_RETRIES; retry++) {
		try {
			const content = mountPrompt(textChunk);

			const response = await clientOpenAI.chat.completions.create({
				model: AI_MODEL,
				max_tokens: 2048,
				messages: [
					{
						role: 'system',
						content:
							'Você é um extrator de dados cirúrgico e preciso. Responda APENAS com um objeto JSON válido que segue exatamente o schema pedido, sem markdown, sem texto fora do JSON.',
					},
					{
						role: 'user',
						content,
					},
				],
			});

			const textResult = response.choices[0]?.message.content;

			if (!textResult) {
				throw new Error('Modelo retornou resposta vazia.');
			}

			const jsonClear = textResult
				.trim()
				.replace(/^```json\s*/i, '')
				.replace(/^```\s*/i, '')
				.replace(/```\s*$/i, '');

			const parsed = JSON.parse(jsonClear);

			const valid = SchemaDataExtractEndorsement.parse(parsed);

			return valid;
		} catch (error) {
			lastError = error;

			if (retry < MAX_RETRIES) {
				await new Promise((r) => setTimeout(r, 1000 * retry));
			}
		}
	}

	throw new Error(
		`Falha ao extrair dados válidos após ${MAX_RETRIES} tentativas. Último erro: ${lastError}`,
	);
}

async function extractDataEndorsement(path: ArrayBuffer) {
	const textToPDF = await extractTextToPDF(path);

	const extracted = await extractToAI(textToPDF);

	return extracted;
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

				const cached = await ctx.cache.get(`endorsement-pdf-extract:${hash}`);

				if (cached) {
					return ctx.json(JSON.parse(cached), 200);
				}

				const extracted = await extractDataEndorsement(buffer);

				const safeId =
					id ?? (await findSafeByLookup(ctx.database, extracted.lookup));

				if (!safeId) {
					throw new Error('Não foi encontrada apólice referente ao endosso');
				}

				const response = {
					safeId,
					type: extracted.type,
					data: extracted.data,
				};

				await ctx.cache.set(
					`endorsement-pdf-extract:${hash}`,
					JSON.stringify(response),
					'EX',
					60 * 60 * 24 * 1,
				);

				return ctx.json(response, 200);
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
