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

/**
 * ============================================================================
 * Helpers
 * ============================================================================
 */

const MoneyPattern =
	'(?:R\\$\\s*)?-?\\d{1,3}(?:\\.\\d{3})*,\\d{2}|(?:R\\$\\s*)?-?\\d+,\\d{2}';

function parseBrazilianNumber(value: unknown): unknown {
	if (typeof value === 'number') {
		return value;
	}

	if (typeof value !== 'string') {
		return value;
	}

	let normalized = value
		.trim()
		.replace(/\s/g, '')
		.replace(/R\$/gi, '')
		.replace(/%/g, '');

	if (!normalized) {
		return value;
	}

	if (normalized.includes(',')) {
		normalized = normalized.replace(/\./g, '').replace(',', '.');
	}

	const parsed = Number(normalized);

	return Number.isFinite(parsed) ? parsed : value;
}

function parseMoney(value: string | null | undefined): number | null {
	if (!value) {
		return null;
	}

	const parsed = parseBrazilianNumber(value);

	return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
}

function parseLooseNumber(value: unknown): number | null {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : null;
	}

	if (typeof value !== 'string') {
		return null;
	}

	const parsed = parseBrazilianNumber(value);

	return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
}

function normalizePlate(value: string | null | undefined): string | null {
	if (!value) {
		return null;
	}

	const text = value.trim().toUpperCase();

	if (
		!text ||
		text === '-' ||
		text === 'A AVISAR' ||
		text === 'AVISAR' ||
		text === 'SEM PLACA' ||
		text === 'S/ PLACA' ||
		text === 'S/PLACA'
	) {
		return null;
	}

	const normalized = text.replace(/[^A-Z0-9]/g, '');

	if (normalized.length !== 7) {
		return null;
	}

	return normalized;
}

function normalizeSearchText(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractMoneyNearLabels(
	text: string,
	labels: string[],
	maxDistance = 120,
): number | null {
	for (const label of labels) {
		const pattern = new RegExp(
			`${escapeRegExp(label)}[\\s\\S]{0,${maxDistance}}?(${MoneyPattern})`,
			'i',
		);

		const match = text.match(pattern);

		if (!match?.[1]) {
			continue;
		}

		const value = parseMoney(match[1]);

		if (value !== null) {
			return value;
		}
	}

	return null;
}

function extractMoneyValues(text: string): number[] {
	const pattern = new RegExp(`(${MoneyPattern})`, 'gi');

	return [...text.matchAll(pattern)]
		.map((match) => parseMoney(match[1]))
		.filter((value): value is number => value !== null);
}

/**
 * ============================================================================
 * Compactação
 * ============================================================================
 */

function compactDocumentText(text: string): string {
	const lines = text.split(/\r?\n/);

	if (lines.length <= 90) {
		return text;
	}

	const keywords = [
		'endosso',
		'alteracao',
		'substituicao',
		'cancelamento',
		'segurado',
		'cpf',
		'cnpj',
		'apolice',
		'veiculo',
		'placa',
		'chassi',
		'condutor',
		'modelo',
		'franquia',
		'premio',
		'preco',
		'liquido',
		'iof',
		'juros',
		'restituir',
		'restituicao',
		'comissao',
		'cep',
		'pernoite',
		'vigencia',
	];

	const keep = new Set<number>();

	for (let index = 0; index < Math.min(45, lines.length); index++) {
		keep.add(index);
	}

	for (let index = 0; index < lines.length; index++) {
		const normalized = normalizeSearchText(lines[index] ?? '');

		if (!keywords.some((keyword) => normalized.includes(keyword))) {
			continue;
		}

		for (let offset = -2; offset <= 3; offset++) {
			const target = index + offset;

			if (target >= 0 && target < lines.length) {
				keep.add(target);
			}
		}
	}

	for (
		let index = Math.max(0, lines.length - 15);
		index < lines.length;
		index++
	) {
		keep.add(index);
	}

	return [...keep]
		.sort((a, b) => a - b)
		.map((index) => lines[index])
		.join('\n');
}

/**
 * ============================================================================
 * Extração determinística financeira
 * ============================================================================
 */

type FinancialSummary = {
	liquid: number | null;

	total: number | null;

	iof: number | null;

	interest: number | null;

	fees: number | null;

	direction: 'charge' | 'refund' | 'neutral' | null;
};

function extractFinancialSummary(text: string): FinancialSummary {
	const refundLiquid = extractMoneyNearLabels(text, [
		'Prêmio Líquido a Restituir',
		'Premio Liquido a Restituir',
		'Valor Líquido a Restituir',
		'Valor Liquido a Restituir',
		'Preço Líquido a Restituir',
		'Preco Liquido a Restituir',
	]);

	let liquid =
		refundLiquid ??
		extractMoneyNearLabels(text, [
			'Prêmio Líquido Total',
			'Prêmio Liquido Total',
			'Prêmio Líquido',
			'Prêmio Liquido',
			'Preço Líquido',
			'Preco Liquido',
			'Valor Líquido',
			'Valor Liquido',
			'Diferença Líquida de Prêmio',
			'Diferenca Liquida de Premio',
		]);

	let total = extractMoneyNearLabels(text, [
		'Prêmio Total',
		'Premio Total',
		'Preço Total',
		'Preco Total',
		'Valor Total',
	]);

	let iof = extractMoneyNearLabels(text, ['IOF'], 60);

	const interest = extractMoneyNearLabels(text, [
		'Valor dos Juros',
		'Valor Juros',
		'Juros',
	]);

	let fees = extractMoneyNearLabels(text, ['Encargos Financeiros', 'Encargos']);

	/**
	 * Alguns layouts:
	 *
	 * Prêmio Líquido Encargos IOF
	 * 374,29 0,00 27,62 401,91
	 */
	const matrixStart = text.search(
		/Pr[eê]mio\s+L[ií]quido(?:\s+Total)?\s+Encargos\s+IOF/i,
	);

	if (matrixStart >= 0) {
		const fragment = text.slice(matrixStart, matrixStart + 300);

		const values = extractMoneyValues(fragment);

		if (values.length >= 4) {
			liquid = values[0] ?? null;

			fees = values[1] ?? null;

			iof = values[2] ?? null;

			total = values[3] ?? null;
		}
	}

	let direction: FinancialSummary['direction'] = null;

	if (refundLiquid !== null) {
		direction = 'refund';
	} else if (liquid !== null && Math.abs(liquid) <= 0.01) {
		direction = 'neutral';
	} else if (liquid !== null) {
		direction = 'charge';
	}

	return {
		liquid,
		total,
		iof,
		interest,
		fees,
		direction,
	};
}

/**
 * ============================================================================
 * Franquia determinística
 * ============================================================================
 */

function extractPrimaryFranchise(text: string): number | null {
	const casco = text.match(
		new RegExp(
			`Casco\\s*:\\s*(?:Reduzida|Normal|B[aá]sica|Obrigat[oó]ria)[^\\n\\r]{0,100}?(${MoneyPattern})`,
			'i',
		),
	);

	if (casco?.[1]) {
		const value = parseMoney(casco[1]);

		if (value !== null) {
			return value;
		}
	}

	const basisThenValue = text.match(
		new RegExp(
			`\\b\\d+(?:[.,]\\d+)?\\s*%\\s+da\\s+(?:Normal|Obrigat[oó]ria|B[aá]sica)[\\s\\S]{0,100}?(${MoneyPattern})`,
			'i',
		),
	);

	if (basisThenValue?.[1]) {
		const value = parseMoney(basisThenValue[1]);

		if (value !== null) {
			return value;
		}
	}

	const valueThenBasis = text.match(
		new RegExp(
			`(${MoneyPattern})[^\\n\\r]{0,80}?\\(\\s*\\d+(?:[.,]\\d+)?\\s*%\\s+da[\\s\\S]{0,60}?(?:Normal|Obrigat[oó]ria|B[aá]sica)`,
			'i',
		),
	);

	if (valueThenBasis?.[1]) {
		const value = parseMoney(valueThenBasis[1]);

		if (value !== null) {
			return value;
		}
	}

	const section = text.match(
		new RegExp(`Franquia\\(s\\)[\\s\\S]{0,180}?(${MoneyPattern})`, 'i'),
	);

	if (section?.[1]) {
		const value = parseMoney(section[1]);

		if (value !== null) {
			return value;
		}
	}

	return null;
}

/**
 * ============================================================================
 * Schemas finais
 * ============================================================================
 */

const SchemaLookup = z
	.object({
		plate: SchemaPlateLenient,

		insuredRegistration: z.string().nullish(),

		insuredName: z.string().nullish(),
	})
	.strict();

const SchemaPercentage = z.number().min(0).max(100).nullish();

const SchemaDataExtractVehicleConductor = z
	.object({
		type: z.literal('vehicle_conductor'),

		lookup: SchemaLookup,

		data: z
			.object({
				driver: z.string().nullish(),

				plate: SchemaPlateLenient,

				model: z.string().nullish(),

				modelYear: z.union([z.string(), z.number()]).nullish(),

				franchise: z.number().nonnegative().nullish(),

				amount: z.number(),

				percentage: SchemaPercentage,
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

				amount: z.number(),

				percentage: SchemaPercentage,
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
				franchise: z.number().nonnegative(),

				amount: z.number(),

				percentage: SchemaPercentage,
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

/**
 * ============================================================================
 * Schema bruto permissivo
 * ============================================================================
 */

const SchemaModelOutput = z
	.object({
		type: z.string(),

		lookup: z
			.object({
				plate: z.string().nullish(),

				insuredRegistration: z.string().nullish(),

				insuredName: z.string().nullish(),
			})
			.passthrough()
			.default({}),

		data: z
			.object({
				driver: z.string().nullish(),

				plate: z.string().nullish(),

				model: z.string().nullish(),

				modelYear: z.union([z.string(), z.number()]).nullish(),

				postalCode: z.string().nullish(),

				effectivedAt: z.string().nullish(),

				franchise: z.union([z.number(), z.string()]).nullish(),

				amount: z.union([z.number(), z.string()]).nullish(),

				amountDirection: z.string().nullish(),

				percentage: z.union([z.number(), z.string()]).nullish(),

				reason: z.string().nullish(),
			})
			.passthrough()
			.default({}),
	})
	.passthrough();

type ModelOutput = z.infer<typeof SchemaModelOutput>;

/**
 * ============================================================================
 * Prompt otimizado
 * ============================================================================
 */

function mountPrompt(
	text: string,
	imagesCount: number,
	{
		amount,
		franchise,
	}: {
		amount: number | null;
		franchise: number | null;
	},
): string {
	return `Extraia os dados deste ENDOSSO DE SEGURO.${visionInstructions(imagesCount)}

Responda APENAS JSON minificado.

Tipos:
- vehicle_conductor: alteração/substituição de veículo ou condutor.
- address: alteração de endereço/CEP/local de risco.
- franchise: finalidade principal é alterar franquia.
- cancellation: cancelamento.
- unknown: outro tipo ou dúvida.

Formato:
{"type":"vehicle_conductor","lookup":{"plate":null,"insuredRegistration":null,"insuredName":null},"data":{"driver":null,"plate":null,"model":null,"modelYear":null,"franchise":null,"amount":null,"amountDirection":"charge","percentage":null}}

Para address use data.postalCode.
Para cancellation use data.effectivedAt.
Para unknown use data.reason.

Regras:
- lookup identifica o seguro ANTERIOR ao endosso.
- CPF/CNPJ e nome são do SEGURADO.
- placa tem 7 caracteres; nunca use chassi.
- em substituição, lookup.plate = placa anterior e data.plate = nova quando ambas existirem.
- amount = valor LÍQUIDO do endosso, SEM IOF, juros ou encargos.
- "Prêmio Líquido Total" continua sendo líquido.
- cobrança => charge; restituição => refund; sem movimentação => neutral.
- percentage = somente comissão explícita do corretor.
- franchise = franquia principal do casco, nunca prêmio da cobertura ou franquias de vidro/farol.
- não invente dados.

Valores já encontrados pelo código; prefira-os quando não houver conflito explícito:
amount=${amount ?? 'null'}
franchise=${franchise ?? 'null'}

Documento:
"""
${text}
"""`;
}

/**
 * ============================================================================
 * Finalização
 * ============================================================================
 */

function normalizeType(
	value: string,
): 'vehicle_conductor' | 'address' | 'franchise' | 'cancellation' | 'unknown' {
	switch (value) {
		case 'vehicle_conductor':
		case 'address':
		case 'franchise':
		case 'cancellation':
		case 'unknown':
			return value;

		default:
			return 'unknown';
	}
}

function normalizeDirection(
	value: string | null | undefined,
	fallback: FinancialSummary['direction'],
): 'charge' | 'refund' | 'neutral' {
	if (value === 'charge' || value === 'refund' || value === 'neutral') {
		return value;
	}

	return fallback ?? 'charge';
}

function normalizePercentage(value: unknown): number | null {
	const parsed = parseLooseNumber(value);

	if (parsed === null || parsed < 0 || parsed > 100) {
		return null;
	}

	return parsed;
}

function normalizeLookup(raw: ModelOutput): z.infer<typeof SchemaLookup> {
	return SchemaLookup.parse({
		plate: normalizePlate(raw.lookup.plate),

		insuredRegistration: raw.lookup.insuredRegistration ?? null,

		insuredName: raw.lookup.insuredName ?? null,
	});
}

function normalizeAmount(raw: ModelOutput, text: string): number {
	const financial = extractFinancialSummary(text);

	const aiAmount = parseLooseNumber(raw.data.amount);

	const liquid = financial.liquid ?? aiAmount;

	if (liquid === null) {
		throw new Error('Não foi possível determinar o valor líquido do endosso');
	}

	const direction = normalizeDirection(
		raw.data.amountDirection,
		financial.direction,
	);

	switch (direction) {
		case 'refund':
			return -Math.abs(liquid);

		case 'neutral':
			return 0;

		case 'charge':
			return Math.abs(liquid);
	}
}

function finalizeModelOutput(
	raw: ModelOutput,
	text: string,
): DataExtractEndorsement {
	const type = normalizeType(raw.type);

	if (type === 'unknown') {
		throw new Error(
			`Tipo de endosso não suportado ou não identificado: ${
				raw.data.reason ?? 'sem informação adicional'
			}`,
		);
	}

	const lookup = normalizeLookup(raw);

	const percentage = normalizePercentage(raw.data.percentage);

	const franchise =
		extractPrimaryFranchise(text) ?? parseLooseNumber(raw.data.franchise);

	switch (type) {
		case 'vehicle_conductor': {
			return SchemaDataExtractVehicleConductor.parse({
				type,

				lookup,

				data: {
					driver: raw.data.driver ?? null,

					plate: normalizePlate(raw.data.plate),

					model: raw.data.model ?? null,

					modelYear: raw.data.modelYear ?? null,

					franchise,

					amount: normalizeAmount(raw, text),

					percentage,
				},
			});
		}

		case 'address': {
			if (!raw.data.postalCode) {
				throw new Error('Novo CEP não identificado');
			}

			return SchemaDataExtractAddress.parse({
				type,

				lookup,

				data: {
					postalCode: raw.data.postalCode,

					amount: normalizeAmount(raw, text),

					percentage,
				},
			});
		}

		case 'franchise': {
			if (franchise === null) {
				throw new Error('Nova franquia não identificada');
			}

			return SchemaDataExtractFranchise.parse({
				type,

				lookup,

				data: {
					franchise,

					amount: normalizeAmount(raw, text),

					percentage,
				},
			});
		}

		case 'cancellation': {
			if (!raw.data.effectivedAt) {
				throw new Error('Data do cancelamento não identificada');
			}

			return SchemaDataExtractCancellation.parse({
				type,

				lookup,

				data: {
					effectivedAt: raw.data.effectivedAt,
				},
			});
		}
	}
}

/**
 * ============================================================================
 * IA
 * ============================================================================
 */

async function askModel({
	model,
	text,
	images,
}: {
	model: string;
	text: string;
	images: Array<string>;
}): Promise<DataExtractEndorsement> {
	const compactText = compactDocumentText(text);

	const financial = extractFinancialSummary(text);

	const franchise = extractPrimaryFranchise(text);

	const started = performance.now();

	try {
		const response = await askJson({
			model,

			prompt: mountPrompt(compactText, images.length, {
				amount: financial.liquid,

				franchise,
			}),

			images,
		});

		const raw = SchemaModelOutput.parse(response);

		const result = finalizeModelOutput(raw, text);

		console.log(
			`[extract-endorsement] ask aceito ${Math.round(
				performance.now() - started,
			)}ms texto=${text.length} compactado=${compactText.length}`,
		);

		return result;
	} catch (error) {
		console.warn(
			'[extract-endorsement] ask rejeitado:',
			error instanceof Error ? error.message : error,
		);

		throw error;
	}
}

async function extractDataEndorsement(path: ArrayBuffer) {
	return await runPdfExtraction({
		label: 'extract-endorsement',

		buffer: path,

		ask: askModel,
	});
}

/**
 * ============================================================================
 * Lookup do seguro
 * ============================================================================
 */

async function findSafeByLookup(
	database: Database,
	lookup: DataExtractEndorsement['lookup'],
): Promise<string | null> {
	const insuredRegistration = lookup.insuredRegistration
		? maskNumber(lookup.insuredRegistration)
		: null;

	if (lookup.plate) {
		const plate = lookup.plate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

		const safe = await database.safe.findFirst({
			where: {
				safeVehicle: {
					OR: [
						{
							plate,
						},

						{
							vehicle: {
								OR: [
									{
										plate,
									},

									{
										plateAlternative: plate,
									},
								],
							},
						},
					],
				},

				...(insuredRegistration && {
					insured: {
						OR: [
							{
								cpf: insuredRegistration,
							},

							{
								cnpj: insuredRegistration,
							},
						],
					},
				}),
			},

			select: {
				id: true,
			},
		});

		if (safe) {
			return safe.id;
		}
	}

	if (insuredRegistration) {
		const candidates = await database.safe.findMany({
			where: {
				insured: {
					OR: [
						{
							cpf: insuredRegistration,
						},

						{
							cnpj: insuredRegistration,
						},
					],
				},
			},

			select: {
				id: true,
			},

			take: 2,
		});

		if (candidates.length === 1) {
			return candidates[0]?.id ?? null;
		}
	}

	return null;
}

/**
 * ============================================================================
 * Router
 * ============================================================================
 */

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
				id: z.uuidv7('ID do seguro inválido').optional(),
			}),
		),

		async (ctx) => {
			try {
				const { file } = ctx.req.valid('form');

				const { id } = ctx.req.valid('query');

				const buffer = await file.arrayBuffer();

				const hash = Bun.hash(buffer).toString(16);

				const cacheKey = `endorsement-pdf-extract:v10:${hash}`;

				const cached = await ctx.cache.get(cacheKey);

				let extracted: DataExtractEndorsement | null = null;

				// if (cached) {
				// 	try {
				// 		extracted =
				// 			SchemaDataExtractEndorsement.parse(
				// 				JSON.parse(
				// 					cached,
				// 				),
				// 			);
				// 	} catch {
				// 		extracted =
				// 			null;
				// 	}
				// }

				if (!extracted) {
					extracted = await extractDataEndorsement(buffer);

					await ctx.cache.set(
						cacheKey,
						JSON.stringify(extracted),
						'EX',
						60 * 60 * 24,
					);
				}

				const safeId =
					id ?? (await findSafeByLookup(ctx.database, extracted.lookup));

				if (!safeId) {
					throw new Error(
						'Não foi encontrada apólice referente ao endosso; selecione o seguro manualmente',
					);
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
				const message =
					error instanceof Error
						? error.message
						: 'Falha ao extrair dados do documento';

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
