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
 * Financeiro
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
		'Valor juros',
		'Valor dos juros',
		'Juros',
	]);

	let fees = extractMoneyNearLabels(text, ['Encargos', 'Encargos financeiros']);

	/**
	 * Layout tipo MAPFRE/Tokio:
	 *
	 * Prêmio Líquido Encargos IOF
	 * 374,29 0,00 27,62 401,91
	 * Prêmio Total
	 */
	const matrixStart = text.search(
		/Pr[eê]mio\s+L[ií]quido(?:\s+Total)?\s+Encargos\s+IOF/i,
	);

	if (matrixStart >= 0) {
		const fragment = text.slice(matrixStart, matrixStart + 300);
		const values = extractMoneyValues(fragment);

		if (values.length >= 4) {
			liquid ??= values[0] ?? null;
			fees ??= values[1] ?? null;
			iof ??= values[2] ?? null;
			total ??= values[3] ?? null;
		}
	}

	let direction: FinancialSummary['direction'] = null;

	if (liquid !== null) {
		if (refundLiquid !== null) {
			direction = 'refund';
		} else if (Math.abs(liquid) <= 0.01) {
			direction = 'neutral';
		} else {
			direction = 'charge';
		}
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
	const cascoMatch = text.match(
		new RegExp(
			`Casco\\s*:\\s*(?:Reduzida|Normal|B[aá]sica|Obrigat[oó]ria)[^\\n\\r]{0,100}?(${MoneyPattern})`,
			'i',
		),
	);

	if (cascoMatch?.[1]) {
		const value = parseMoney(cascoMatch[1]);

		if (value !== null) {
			return value;
		}
	}

	const basisBeforeValue = text.match(
		new RegExp(
			`\\b\\d+(?:[.,]\\d+)?\\s*%\\s+da\\s+(?:Normal|Obrigat[oó]ria|B[aá]sica)[^\\n\\r]{0,100}?(${MoneyPattern})`,
			'i',
		),
	);

	if (basisBeforeValue?.[1]) {
		const value = parseMoney(basisBeforeValue[1]);

		if (value !== null) {
			return value;
		}
	}

	const valueBeforeBasis = text.match(
		new RegExp(
			`(${MoneyPattern})[^\\n\\r]{0,80}?\\(\\s*\\d+(?:[.,]\\d+)?\\s*%\\s+da[\\s\\S]{0,60}?(?:Normal|Obrigat[oó]ria|B[aá]sica)`,
			'i',
		),
	);

	if (valueBeforeBasis?.[1]) {
		const value = parseMoney(valueBeforeBasis[1]);

		if (value !== null) {
			return value;
		}
	}

	const mandatoryMatch = text.match(
		new RegExp(
			`FRANQUIA\\s*-\\s*PARTICIPA[CÇ][AÃ]O\\s+OBRIGAT[ÓO]RIA[\\s\\S]{0,220}?(${MoneyPattern})`,
			'i',
		),
	);

	if (mandatoryMatch?.[1]) {
		const value = parseMoney(mandatoryMatch[1]);

		if (value !== null) {
			return value;
		}
	}

	const sectionMatch = text.match(
		new RegExp(`Franquia\\(s\\)[\\s\\S]{0,180}?(${MoneyPattern})`, 'i'),
	);

	if (sectionMatch?.[1]) {
		const value = parseMoney(sectionMatch[1]);

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

const SchemaPercentage = z
	.number('Percentual de comissão inválido')
	.min(0, 'Percentual de comissão inválido')
	.max(100, 'Percentual de comissão inválido')
	.nullish();

const SchemaDataExtractVehicleConductor = z
	.object({
		type: z.literal('vehicle_conductor'),

		lookup: SchemaLookup,

		data: z
			.object({
				driver: z
					.string('CPF do condutor inválido')
					.min(1, 'CPF do condutor inválido')
					.nullish(),

				plate: SchemaPlateLenient,

				model: z.string('Modelo do veículo inválido').nullish(),

				modelYear: z.union([z.string(), z.number()]).nullish(),

				franchise: z
					.number('Valor da frânquia inválido')
					.nonnegative('Valor da frânquia inválido')
					.nullish(),

				/**
				 * Líquido, sem IOF/juros/encargos.
				 */
				amount: z.number('Valor do endosso inválido'),

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

				amount: z.number('Valor do endosso inválido'),

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
				franchise: z
					.number('Valor da frânquia inválido')
					.nonnegative('Valor da frânquia inválido'),

				amount: z.number('Valor do endosso inválido'),

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
 * Schema bruto da IA
 * ============================================================================
 */

const SchemaModelMoney = z.preprocess(
	parseBrazilianNumber,
	z.number().finite(),
);

const SchemaModelMoneyNullable = SchemaModelMoney.nullable();

const SchemaModelPercentage = z.preprocess(
	parseBrazilianNumber,
	z.number().finite().min(0).max(100),
);

const SchemaModelLookup = z
	.object({
		plate: z.string().nullable(),

		insuredRegistration: z.string().nullable(),

		insuredName: z.string().nullable(),
	})
	.strict();

const SchemaModelFinancial = z
	.object({
		/**
		 * Valor líquido.
		 */
		amount: SchemaModelMoneyNullable,

		amountDirection: z.enum(['charge', 'refund', 'neutral']).nullable(),

		percentage: SchemaModelPercentage.nullable(),
	})
	.strict();

const SchemaModelVehicleConductor = z
	.object({
		type: z.literal('vehicle_conductor'),

		lookup: SchemaModelLookup,

		data: z
			.object({
				driver: z.string().nullable(),

				plate: z.string().nullable(),

				model: z.string().nullable(),

				modelYear: z.union([z.string(), z.number()]).nullable(),

				franchise: SchemaModelMoneyNullable,
			})
			.merge(SchemaModelFinancial)
			.strict(),
	})
	.strict();

const SchemaModelAddress = z
	.object({
		type: z.literal('address'),

		lookup: SchemaModelLookup,

		data: z
			.object({
				postalCode: z.string().nullable(),
			})
			.merge(SchemaModelFinancial)
			.strict(),
	})
	.strict();

const SchemaModelFranchise = z
	.object({
		type: z.literal('franchise'),

		lookup: SchemaModelLookup,

		data: z
			.object({
				franchise: SchemaModelMoneyNullable,
			})
			.merge(SchemaModelFinancial)
			.strict(),
	})
	.strict();

const SchemaModelCancellation = z
	.object({
		type: z.literal('cancellation'),

		lookup: SchemaModelLookup,

		data: z
			.object({
				effectivedAt: z.string().nullable(),
			})
			.strict(),
	})
	.strict();

const SchemaModelUnknown = z
	.object({
		type: z.literal('unknown'),

		lookup: SchemaModelLookup,

		data: z
			.object({
				reason: z.string(),
			})
			.strict(),
	})
	.strict();

const SchemaModelOutput = z.discriminatedUnion('type', [
	SchemaModelVehicleConductor,
	SchemaModelAddress,
	SchemaModelFranchise,
	SchemaModelCancellation,
	SchemaModelUnknown,
]);

type ModelOutput = z.infer<typeof SchemaModelOutput>;

/**
 * ============================================================================
 * Prompt
 * ============================================================================
 */

function mountPrompt(text: string, imagesCount: number): string {
	return `
Extraia os dados deste ENDOSSO DE SEGURO.

${visionInstructions(imagesCount)}

O documento pode ser de qualquer seguradora.

O texto extraído de PDF pode perder alinhamento e colunas.
Quando imagens estiverem disponíveis, use-as para confirmar tabelas.

Responda SOMENTE JSON minificado.

TIPOS SUPORTADOS

vehicle_conductor:
alteração/substituição de veículo, placa, modelo ou condutor.

address:
alteração de endereço, local de risco ou CEP de pernoite.

franchise:
endosso cuja finalidade PRINCIPAL seja alterar a franquia.

cancellation:
cancelamento/rescisão.

unknown:
qualquer outro endosso ou quando não houver segurança suficiente.

A simples presença de uma franquia NÃO torna o endosso do tipo franchise.

LOOKUP

{
	"plate": "string ou null",
	"insuredRegistration": "string ou null",
	"insuredName": "string ou null"
}

Use CPF/CNPJ e nome do SEGURADO.

Não use CPF do corretor ou de terceiro.

PLACA

Placa brasileira normalmente possui 7 caracteres.
Chassi normalmente possui 17.
Nunca use chassi como placa.

Se houver placa anterior e nova:
lookup.plate = anterior
data.plate = nova.

VALOR / amount

REGRA MAIS IMPORTANTE:

amount = valor LÍQUIDO do endosso.

Não inclua:
- IOF;
- juros;
- encargos;
- total financeiro da forma de pagamento.

Exemplo:

Preço Líquido 36,57
IOF 2,70
Preço Total 39,27

=> amount = 36.57

Exemplo:

Prêmio Líquido Total 374,29
IOF 27,62
Prêmio Total 401,91

=> amount = 374.29

"Prêmio Líquido Total" é um valor líquido válido.

Se for restituição:
amountDirection = refund

Se for cobrança:
amountDirection = charge

Se explicitamente sem movimentação:
amount = 0
amountDirection = neutral

COMISSÃO

percentage = SOMENTE percentual explícito de comissão do corretor.

Não confunda com:
- FIPE;
- desconto;
- bônus;
- percentual da franquia.

FRANQUIA

franchise = franquia PRINCIPAL do casco.

Exemplos:

Casco: Reduzida 50% 3.837,09
=> franchise = 3837.09

Descrição | LMI | Franquia | Valor do Prêmio
Compreensiva | 100% | 1.973,00 | 1.071,27

=> franchise = 1973

Não use franquias de vidro, farol, lanterna ou retrovisor.

FORMATOS

vehicle_conductor:

{
	"type": "vehicle_conductor",
	"lookup": {
		"plate": "string ou null",
		"insuredRegistration": "string ou null",
		"insuredName": "string ou null"
	},
	"data": {
		"driver": "string ou null",
		"plate": "string ou null",
		"model": "string ou null",
		"modelYear": "string, number ou null",
		"franchise": "number ou null",
		"amount": "number ou null",
		"amountDirection": "charge, refund, neutral ou null",
		"percentage": "number ou null"
	}
}

address:

{
	"type": "address",
	"lookup": {
		"plate": "string ou null",
		"insuredRegistration": "string ou null",
		"insuredName": "string ou null"
	},
	"data": {
		"postalCode": "string ou null",
		"amount": "number ou null",
		"amountDirection": "charge, refund, neutral ou null",
		"percentage": "number ou null"
	}
}

franchise:

{
	"type": "franchise",
	"lookup": {
		"plate": "string ou null",
		"insuredRegistration": "string ou null",
		"insuredName": "string ou null"
	},
	"data": {
		"franchise": "number ou null",
		"amount": "number ou null",
		"amountDirection": "charge, refund, neutral ou null",
		"percentage": "number ou null"
	}
}

cancellation:

{
	"type": "cancellation",
	"lookup": {
		"plate": "string ou null",
		"insuredRegistration": "string ou null",
		"insuredName": "string ou null"
	},
	"data": {
		"effectivedAt": "DD/MM/AAAA ou null"
	}
}

unknown:

{
	"type": "unknown",
	"lookup": {
		"plate": "string ou null",
		"insuredRegistration": "string ou null",
		"insuredName": "string ou null"
	},
	"data": {
		"reason": "string"
	}
}

Não invente dados.

Texto:

"""
${text}
"""
`;
}

/**
 * ============================================================================
 * Enriquecimento determinístico
 * ============================================================================
 */

function enrichModelOutputFromText(
	raw: ModelOutput,
	text: string,
): ModelOutput {
	const financial = extractFinancialSummary(text);

	const franchise = extractPrimaryFranchise(text);

	switch (raw.type) {
		case 'vehicle_conductor': {
			return {
				...raw,

				data: {
					...raw.data,

					amount: financial.liquid ?? raw.data.amount,

					amountDirection: financial.direction ?? raw.data.amountDirection,

					franchise: franchise ?? raw.data.franchise,

					plate: normalizePlate(raw.data.plate),
				},
			};
		}

		case 'franchise': {
			return {
				...raw,

				data: {
					...raw.data,

					amount: financial.liquid ?? raw.data.amount,

					amountDirection: financial.direction ?? raw.data.amountDirection,

					franchise: franchise ?? raw.data.franchise,
				},
			};
		}

		case 'address': {
			return {
				...raw,

				data: {
					...raw.data,

					amount: financial.liquid ?? raw.data.amount,

					amountDirection: financial.direction ?? raw.data.amountDirection,
				},
			};
		}

		case 'cancellation':
		case 'unknown': {
			return raw;
		}
	}
}

/**
 * ============================================================================
 * Financeiro final
 * ============================================================================
 */

function normalizeFinancialData(
	data: z.infer<typeof SchemaModelFinancial>,
	text: string,
): {
	amount: number;
	percentage: number | null;
} {
	const financial = extractFinancialSummary(text);

	const rawAmount = financial.liquid ?? data.amount;

	if (rawAmount === null) {
		throw new Error('Não foi possível determinar o valor líquido do endosso');
	}

	/**
	 * Se o texto trouxe explicitamente líquido e total diferentes,
	 * jamais aceitamos o total como amount.
	 */
	if (
		financial.liquid !== null &&
		financial.total !== null &&
		Math.abs(financial.liquid - financial.total) > 0.05 &&
		Math.abs(rawAmount - financial.total) <= 0.05
	) {
		throw new Error(
			'O valor total com IOF/juros foi confundido com o valor líquido do endosso',
		);
	}

	const direction =
		financial.direction ??
		data.amountDirection ??
		(rawAmount > 0 ? 'charge' : rawAmount < 0 ? 'refund' : 'neutral');

	let amount: number;

	switch (direction) {
		case 'charge': {
			amount = Math.abs(rawAmount);

			break;
		}

		case 'refund': {
			amount = -Math.abs(rawAmount);

			break;
		}

		case 'neutral': {
			amount = 0;

			break;
		}
	}

	return {
		amount,

		percentage: data.percentage,
	};
}

/**
 * ============================================================================
 * Lookup
 * ============================================================================
 */

function normalizeLookup(
	lookup: ModelOutput['lookup'],
): z.infer<typeof SchemaLookup> {
	return SchemaLookup.parse({
		plate: normalizePlate(lookup.plate),

		insuredRegistration: lookup.insuredRegistration,

		insuredName: lookup.insuredName,
	});
}

/**
 * ============================================================================
 * Finalização
 * ============================================================================
 */

function finalizeModelOutput(
	raw: ModelOutput,
	text: string,
): DataExtractEndorsement {
	const enriched = enrichModelOutputFromText(raw, text);

	if (enriched.type === 'unknown') {
		throw new Error(
			`Tipo de endosso não suportado ou não identificado com segurança: ${enriched.data.reason}`,
		);
	}

	const lookup = normalizeLookup(enriched.lookup);

	switch (enriched.type) {
		case 'vehicle_conductor': {
			const financial = normalizeFinancialData(enriched.data, text);

			return SchemaDataExtractVehicleConductor.parse({
				type: 'vehicle_conductor',

				lookup,

				data: {
					driver: enriched.data.driver,

					plate: normalizePlate(enriched.data.plate),

					model: enriched.data.model,

					modelYear: enriched.data.modelYear,

					franchise: enriched.data.franchise,

					amount: financial.amount,

					percentage: financial.percentage,
				},
			});
		}

		case 'address': {
			if (!enriched.data.postalCode) {
				throw new Error('Endosso de endereço identificado sem novo CEP');
			}

			const financial = normalizeFinancialData(enriched.data, text);

			return SchemaDataExtractAddress.parse({
				type: 'address',

				lookup,

				data: {
					postalCode: enriched.data.postalCode,

					amount: financial.amount,

					percentage: financial.percentage,
				},
			});
		}

		case 'franchise': {
			if (enriched.data.franchise === null) {
				throw new Error(
					'Endosso de franquia sem novo valor da franquia identificado',
				);
			}

			const financial = normalizeFinancialData(enriched.data, text);

			return SchemaDataExtractFranchise.parse({
				type: 'franchise',

				lookup,

				data: {
					franchise: enriched.data.franchise,

					amount: financial.amount,

					percentage: financial.percentage,
				},
			});
		}

		case 'cancellation': {
			if (!enriched.data.effectivedAt) {
				throw new Error('Endosso de cancelamento sem data de efetivação');
			}

			return SchemaDataExtractCancellation.parse({
				type: 'cancellation',

				lookup,

				data: {
					effectivedAt: enriched.data.effectivedAt,
				},
			});
		}
	}
}

/**
 * ============================================================================
 * IA
 *
 * Sem retry interno.
 *
 * O runPdfExtraction é o responsável por retry/text/vision.
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
	const response = await askJson({
		model,

		prompt: mountPrompt(text, images.length),

		images,
	});

	const parsed = SchemaModelOutput.parse(response);

	return finalizeModelOutput(parsed, text);
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
 * Busca do seguro
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

				/**
				 * v9:
				 *
				 * - removido retry interno;
				 * - removida chamada separada de franquia;
				 * - valor líquido determinístico;
				 * - franquia determinística quando possível;
				 * - runPdfExtraction controla sozinho os fallbacks.
				 */
				const cacheKey = `endorsement-pdf-extract:v9:${hash}`;

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
				// 	} catch (error) {
				// 		console.warn(
				// 			'[extract-endorsement] cache incompatível:',
				// 			error instanceof
				// 				Error
				// 				? error.message
				// 				: error,
				// 		);
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
