import { zValidator } from '@hono/zod-validator';
import {
	isCPF,
	maskNumber,
	SchemaCNPJ,
	SchemaCPF,
	SchemaCPFOrCNPJ,
	SchemaDateString,
	SchemaModality,
	SchemaName,
	SchemaPhone,
	SchemaPostalCode,
	SchemaVehicleUsage,
} from '@segwise/core';
import { format } from 'date-fns';
import { z } from 'zod';
import type { Server } from '@/@types/server';
import { documentByCNPJ } from '@/functions/document/by-cnpj';
import { documentByCPF } from '@/functions/document/by-cpf';
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

function parseInstallments(value: unknown): unknown {
	if (typeof value === 'number') {
		return value;
	}

	if (typeof value !== 'string') {
		return value;
	}

	const normalized = value.trim().toLowerCase();

	if (
		normalized === 'à vista' ||
		normalized === 'a vista' ||
		normalized === 'avista'
	) {
		return 1;
	}

	const timesMatch = normalized.match(/\b(\d{1,2})\s*x\b/);

	if (timesMatch?.[1]) {
		const parsed = Number(timesMatch[1]);

		return Number.isFinite(parsed) ? parsed : value;
	}

	const installmentsMatch = normalized.match(
		/\b(\d{1,2})\s*(?:parcelas?|parc\.?)\b/,
	);

	if (installmentsMatch?.[1]) {
		const parsed = Number(installmentsMatch[1]);

		return Number.isFinite(parsed) ? parsed : value;
	}

	if (/^\d{1,2}$/.test(normalized)) {
		const parsed = Number(normalized);

		return Number.isFinite(parsed) ? parsed : value;
	}

	return value;
}

function parseYear(value: unknown): unknown {
	if (typeof value === 'number') {
		return value;
	}

	if (typeof value !== 'string') {
		return value;
	}

	const years = value.match(/\b(?:19|20)\d{2}\b/g);

	if (!years?.length) {
		return value;
	}

	/**
	 * Quando aparecer:
	 *
	 * 2025 / 2026
	 *
	 * normalmente é fabricação / modelo.
	 */
	const parsed = Number(years.at(-1));

	return Number.isFinite(parsed) ? parsed : value;
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

	/**
	 * Também evita interpretar chassi como placa.
	 */
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
 * Extração determinística financeira
 * ============================================================================
 */

type FinancialSummary = {
	liquid: number | null;
	total: number | null;
	iof: number | null;
	interest: number | null;
	fees: number | null;
};

function extractFinancialSummary(text: string): FinancialSummary {
	let liquid = extractMoneyNearLabels(text, [
		'Prêmio Líquido Total',
		'Prêmio Liquido Total',
		'Prêmio Líquido',
		'Prêmio Liquido',
		'Preço Líquido',
		'Preco Liquido',
		'Valor Líquido',
		'Valor Liquido',
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
	 * MAPFRE, por exemplo, lineariza:
	 *
	 * Prêmio Líquido Encargos IOF
	 * 2.630,37 0,00 194,13 2.824,50
	 * Prêmio Total
	 *
	 * O label "Prêmio Total" vem DEPOIS do valor.
	 */
	const mapfreStart = text.search(/Pr[eê]mio\s+L[ií]quido\s+Encargos\s+IOF/i);

	if (mapfreStart >= 0) {
		const fragment = text.slice(mapfreStart, mapfreStart + 300);
		const values = extractMoneyValues(fragment);

		if (values.length >= 4) {
			liquid ??= values[0] ?? null;
			fees ??= values[1] ?? null;
			iof ??= values[2] ?? null;
			total ??= values[3] ?? null;
		}
	}

	/**
	 * Layout comum:
	 *
	 * Valor líquido | IOF | Juros | Encargos | ... | Valor total
	 *
	 * O líquido continua sendo a informação principal para a corretora.
	 */
	const genericStart = text.search(
		/(?:Valor|Pr[eê]mio|Pre[cç]o)\s+L[ií]quido/i,
	);

	if (genericStart >= 0 && liquid === null) {
		const fragment = text.slice(genericStart, genericStart + 300);
		const values = extractMoneyValues(fragment);

		if (values.length) {
			liquid = values[0] ?? null;
		}
	}

	return {
		liquid,
		total,
		iof,
		interest,
		fees,
	};
}

/**
 * ============================================================================
 * Extração determinística de parcelas
 * ============================================================================
 */

function extractInstallmentsFromText(text: string): number | null {
	const patterns = [
		/C[oó]digo\s+do\s+Plano[\s\S]{0,100}?\b(\d{1,2})\s*parc/i,
		/\bem\s+(\d{1,2})\s+parcelas?\b/i,
		/\b(\d{1,2})\s+parcelas?\b/i,
		/\b(\d{1,2})\s+parc\.?\b/i,
		/\b(\d{1,2})\s*x\b/i,
	];

	for (const pattern of patterns) {
		const match = text.match(pattern);

		if (!match?.[1]) {
			continue;
		}

		const value = Number(match[1]);

		if (Number.isInteger(value) && value > 0 && value <= 60) {
			return value;
		}
	}

	if (/Forma\s+de\s+pagamento[\s\S]{0,100}?(?:à vista|a vista)/i.test(text)) {
		return 1;
	}

	return null;
}

/**
 * ============================================================================
 * Extração determinística do uso do veículo
 * ============================================================================
 */

function extractVehicleUsageFromText(
	text: string,
): z.infer<typeof SchemaVehicleUsage> | null {
	/**
	 * Procuramos primeiro um CAMPO explícito.
	 *
	 * Isso evita interpretar frases genéricas das condições gerais.
	 */
	const match = text.match(
		/(?:^|\n)\s*(?:Uso|Finalidade\s+de\s+Uso)\s*:\s*([^\n\r]+)/i,
	);

	let value = match?.[1] ?? null;

	/**
	 * Alguns layouts trazem "Categoria de Risco: Automóvel - Particular"
	 * mas não possuem um campo separado de finalidade.
	 */
	if (!value) {
		const categoryMatch = text.match(
			/(?:Categoria\s+de\s+Risco|Categoria\s+Tarif[aá]ria)\s*:\s*([^\n\r]+)/i,
		);

		value = categoryMatch?.[1] ?? null;
	}

	if (!value) {
		return null;
	}

	const normalized = normalizeSearchText(value);

	if (
		normalized.includes('aplicativo') ||
		normalized.includes('uber') ||
		/\b99\b/.test(normalized)
	) {
		return 'app_based_transport';
	}

	if (normalized.includes('taxi')) {
		return 'taxi';
	}

	if (
		normalized.includes('transporte publico') ||
		normalized.includes('transporte de passageiros')
	) {
		return 'public_transportation';
	}

	if (normalized.includes('entrega') || normalized.includes('delivery')) {
		return 'delivieries';
	}

	if (normalized.includes('turismo')) {
		return 'tourism';
	}

	if (normalized.includes('cliente') || normalized.includes('fornecedor')) {
		return 'client_supplier_visits';
	}

	/**
	 * REGRA DO SEU SISTEMA:
	 *
	 * "PARTICULAR" significa uso pessoal que pode incluir deslocamento
	 * cotidiano e ida/volta ao trabalho.
	 */
	if (normalized.includes('particular')) {
		return 'leisure_and_work';
	}

	if (normalized.includes('trabalho') && normalized.includes('lazer')) {
		return 'leisure_and_work';
	}

	if (normalized.includes('lazer')) {
		return 'leisure';
	}

	return null;
}

/**
 * ============================================================================
 * Extração determinística da franquia principal
 * ============================================================================
 */

function extractPrimaryFranchise(text: string): number | null {
	/**
	 * MAPFRE:
	 *
	 * Franquia(s)
	 * Casco: Reduzida 50% 3.837,09
	 */
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

	/**
	 * Allianz:
	 *
	 * 25% da Normal 1.716,59
	 *
	 * Porto e outras:
	 *
	 * 50% da Obrigatória ...
	 */
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

	/**
	 * Alguns PDFs perdem a posição das colunas e ficam assim:
	 *
	 * R$ 1.973,00 (50% da ... Obrigatória)
	 *
	 * Aqui selecionamos o valor imediatamente associado à base da
	 * franquia, em vez do prêmio que pode aparecer depois.
	 */
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

	/**
	 * Seção explicitamente intitulada "Franquia(s)".
	 *
	 * Limitamos bastante a janela para não cair em franquias de vidro.
	 */
	const sectionMatch = text.match(
		new RegExp(`Franquia\\(s\\)[\\s\\S]{0,180}?(${MoneyPattern})`, 'i'),
	);

	if (sectionMatch?.[1]) {
		const value = parseMoney(sectionMatch[1]);

		if (value !== null) {
			return value;
		}
	}

	/**
	 * Allianz:
	 *
	 * FRANQUIA - PARTICIPAÇÃO OBRIGATÓRIA
	 */
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

	return null;
}

/**
 * ============================================================================
 * Schemas
 * ============================================================================
 */

const SchemaVehicle = z
	.object({
		plate: SchemaPlateLenient,

		model: z.string('Modelo do veículo inválido'),

		year: z
			.number('Ano do veículo inválido')
			.int('Ano do veículo inválido')
			.min(1900, 'Ano do veículo inválido')
			.max(2100, 'Ano do veículo inválido'),

		usage: SchemaVehicleUsage,

		overnightStayPostalCode: SchemaPostalCode,

		driver: z
			.object({
				name: SchemaName,

				cpf: SchemaCPF,

				birth: SchemaDateString.nullish(),
			})
			.strict()
			.nullish(),
	})
	.strict();

const SchemaDataExtract = z
	.object({
		latestProposal: z
			.string('Código da proposta anterior inválido')
			.min(1, 'Código da proposta anterior inválido')
			.toLowerCase()
			.nullish(),

		renewal: z.boolean('Status de renovação inválido'),

		modality: SchemaModality,

		insuranceCompany: z
			.object({
				id: z.uuidv7('ID da seguradora inválida'),

				name: SchemaName,

				cnpj: SchemaCNPJ,
			})
			.strict(),

		insured: z
			.object({
				name: SchemaName,

				registration: SchemaCPFOrCNPJ,

				phone: z
					.string('Celular inválido')
					.transform(maskNumber)
					.transform((value) =>
						value.slice(0, 2) === '00' ? value.slice(2) : value,
					)
					.pipe(SchemaPhone),

				birth: SchemaDateString.nullish(),

				profession: z.string().nullish(),
			})
			.strict(),

		vehicle: SchemaVehicle.nullish(),

		effectivedAt: SchemaDateString.nullish(),

		requestedAt: SchemaDateString,

		expirationAt: SchemaDateString,

		/**
		 * Prêmio/preço LÍQUIDO.
		 *
		 * Não inclui IOF, juros ou encargos.
		 */
		award: z
			.number('Valor da proposta inválido')
			.nonnegative('Valor da proposta inválido'),

		installments: z
			.number('Número de parcelas inválido')
			.int('Número de parcelas inválido')
			.positive('Número de parcelas inválido')
			.max(60, 'Número de parcelas inválido'),

		franchise: z
			.number('Valor da frânquia inválido')
			.nonnegative('Valor da frânquia inválido')
			.nullish(),
	})
	.strict();

type DataExtract = z.infer<typeof SchemaDataExtract>;

type InsuranceCompanyRow = {
	id: string;
	name: string;
	cnpj: string;
};

/**
 * ============================================================================
 * Schema bruto da IA
 *
 * Mantemos pequeno para:
 *
 * 1. reduzir tokens de saída;
 * 2. reduzir latência;
 * 3. deixar valores estruturados serem corrigidos pelo código.
 * ============================================================================
 */

const SchemaModelMoney = z.preprocess(
	parseBrazilianNumber,
	z.number().finite(),
);

const SchemaModelMoneyNullable = SchemaModelMoney.nullable();

const SchemaModelInstallments = z.preprocess(
	parseInstallments,
	z.number().int().positive().max(60),
);

const SchemaModelYear = z.preprocess(
	parseYear,
	z.number().int().min(1900).max(2100),
);

const SchemaModelOutput = z
	.object({
		latestProposal: z.string().nullable(),

		renewal: z.boolean(),

		modality: SchemaModality,

		insuranceCompany: z.number().int().min(1),

		insured: z
			.object({
				name: z.string(),

				registration: z.string(),

				phone: z.string(),

				birth: z.string().nullable(),

				profession: z.string().nullable(),
			})
			.strict(),

		vehicle: z
			.object({
				plate: z.string().nullable(),

				model: z.string(),

				year: SchemaModelYear,

				usage: SchemaVehicleUsage,

				overnightStayPostalCode: z.string(),

				driver: z
					.object({
						name: z.string(),

						cpf: z.string(),

						birth: z.string().nullable(),
					})
					.strict()
					.nullable(),
			})
			.strict()
			.nullable(),

		effectivedAt: z.string().nullable(),

		requestedAt: z.string(),

		expirationAt: z.string(),

		award: SchemaModelMoneyNullable,

		installments: SchemaModelInstallments.nullable(),

		franchise: SchemaModelMoneyNullable,
	})
	.strict();

type ModelOutput = z.infer<typeof SchemaModelOutput>;

/**
 * ============================================================================
 * Prompt
 * ============================================================================
 */

function mountPrompt(
	text: string,
	{
		insuranceCompanies,
		imagesCount,
	}: {
		insuranceCompanies: Array<{
			i: number;
			name: string;
			cnpj: string;
		}>;

		imagesCount: number;
	},
): string {
	const companies = insuranceCompanies
		.map((company) => `${company.i}|${company.name}|${company.cnpj}`)
		.join('\n');

	return `
Extraia os dados desta PROPOSTA ou APÓLICE DE SEGURO.

${visionInstructions(imagesCount)}

O documento pode ser de qualquer seguradora.

O texto de PDF pode perder colunas e alinhamento.
Quando imagens estiverem disponíveis, use-as para confirmar tabelas.

Responda SOMENTE JSON válido minificado:

{
	"latestProposal": "string ou null",
	"renewal": "boolean",
	"modality": "vehicle | motorcycle | truck | health | residence | business | condominium | travel | professional | construction",
	"insuranceCompany": "number",
	"insured": {
		"name": "string",
		"registration": "string",
		"phone": "string",
		"birth": "DD/MM/AAAA ou null",
		"profession": "string ou null"
	},
	"vehicle": {
		"plate": "string ou null",
		"model": "string",
		"year": "number",
		"usage": "leisure_and_work | leisure | client_supplier_visits | app_based_transport | taxi | public_transportation | delivieries | tourism",
		"overnightStayPostalCode": "string",
		"driver": {
			"name": "string",
			"cpf": "string",
			"birth": "DD/MM/AAAA ou null"
		}
	} ou null,
	"effectivedAt": "DD/MM/AAAA ou null",
	"requestedAt": "DD/MM/AAAA",
	"expirationAt": "DD/MM/AAAA",
	"award": "number ou null",
	"installments": "number ou null",
	"franchise": "number ou null"
}

REGRAS PRINCIPAIS

SEGURADORA:
insuranceCompany é o índice "i" da seguradora que efetivamente emite o seguro.
Priorize razão social, CNPJ e código SUSEP.
Não confunda banco ou corretora com seguradora.

${companies}

RENOVAÇÃO:
renewal = true quando houver renovação, apólice anterior, CI anterior ou seguradora anterior.
latestProposal = identificação da apólice/proposta ANTERIOR, nunca a atual.

MODALIDADE:
carro/utilitário => vehicle
moto => motorcycle
caminhão => truck
saúde => health
residência => residence
empresa => business
condomínio => condominium
viagem => travel
profissional => professional
obra => construction

PLACA:
placa brasileira normalmente possui 7 caracteres.
Chassi normalmente possui 17.
Nunca use chassi como placa.
"-", "A AVISAR" e "SEM PLACA" => null.

ANO:
use ANO MODELO.
2025 / 2026 => 2026.

USO:
REGRA IMPORTANTE:
"PARTICULAR" => leisure_and_work.

Também:
"Lazer / ida e volta ao trabalho" => leisure_and_work
somente "Lazer" => leisure
Uber/99/aplicativo => app_based_transport
Táxi => taxi
entregas => delivieries
visitas a clientes/fornecedores => client_supplier_visits
turismo => tourism

Não interprete "Particular" como leisure.

PRÊMIO:
award = prêmio/preço LÍQUIDO TOTAL do produto.

Não inclua:
- IOF;
- juros;
- encargos;
- valor total com impostos.

Exemplos:

Preço Líquido 36,57
IOF 2,70
Preço Total 39,27

=> award = 36.57

Prêmio Líquido 2.630,37
IOF 194,13
Prêmio Total 2.824,50

=> award = 2630.37

"Prêmio Líquido Total" também é válido para award.

PARCELAS:
à vista => 1
10x => 10
12 parc => 12
Nunca use código do plano como quantidade de parcelas.

FRANQUIA:
franchise = franquia PRINCIPAL do casco.

Exemplos:

Casco: Reduzida 50% 3.837,09
=> franchise = 3837.09

Descrição | LMI | Franquia | Valor do Prêmio
Compreensiva | 100% | 1.973,00 | 1.071,27

=> franchise = 1973

Não confunda franquia com prêmio da cobertura.
Não use franquia de vidro, farol, lanterna, retrovisor, roda ou pneu.

CONDUTOR:
use o principal condutor.
Se for "Próprio Segurado", use os dados do segurado.

DATAS:
requestedAt = início da vigência.
expirationAt = fim da vigência.
effectivedAt = data de emissão/efetivação apenas quando for apólice emitida.
Proposta não emitida => null.

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

	const installments = extractInstallmentsFromText(text);

	const franchise = extractPrimaryFranchise(text);

	const usage = extractVehicleUsageFromText(text);

	return {
		...raw,

		/**
		 * Texto explícito possui prioridade para campos altamente
		 * estruturados.
		 */
		award: financial.liquid ?? raw.award,

		installments: installments ?? raw.installments,

		franchise: franchise ?? raw.franchise,

		vehicle: raw.vehicle
			? {
					...raw.vehicle,

					usage: usage ?? raw.vehicle.usage,

					plate: normalizePlate(raw.vehicle.plate),
				}
			: null,
	};
}

/**
 * ============================================================================
 * Validação financeira
 * ============================================================================
 */

function validateFinancialData(raw: ModelOutput, text: string): void {
	if (raw.award === null) {
		throw new Error('Não foi possível determinar o prêmio líquido da proposta');
	}

	if (raw.installments === null) {
		throw new Error('Não foi possível determinar a quantidade de parcelas');
	}

	const financial = extractFinancialSummary(text);

	if (
		financial.liquid !== null &&
		Math.abs(financial.liquid - raw.award) > 0.05
	) {
		throw new Error(
			`Prêmio líquido inconsistente: esperado ${financial.liquid}, extraído ${raw.award}`,
		);
	}

	if (
		financial.total !== null &&
		financial.liquid !== null &&
		Math.abs(raw.award - financial.total) <= 0.05 &&
		Math.abs(financial.total - financial.liquid) > 0.05
	) {
		throw new Error(
			'O prêmio total com IOF/juros foi confundido com o prêmio líquido',
		);
	}
}

/**
 * ============================================================================
 * Finalização
 * ============================================================================
 */

function isVehicleModality(modality: DataExtract['modality']): boolean {
	return (
		modality === 'vehicle' || modality === 'motorcycle' || modality === 'truck'
	);
}

function finalizeModelOutput(
	raw: ModelOutput,
	text: string,
	insuranceCompanies: Array<InsuranceCompanyRow>,
): DataExtract {
	const enriched = enrichModelOutputFromText(raw, text);

	validateFinancialData(enriched, text);

	if (enriched.award === null) {
		throw new Error('Prêmio líquido obrigatório não identificado');
	}

	if (enriched.installments === null) {
		throw new Error('Quantidade de parcelas obrigatória não identificada');
	}

	const company = insuranceCompanies[enriched.insuranceCompany - 1];

	if (!company) {
		throw new Error('Seguradora não encontrada na lista informada');
	}

	const vehicleModality = isVehicleModality(enriched.modality);

	if (vehicleModality && !enriched.vehicle) {
		throw new Error('Seguro veicular identificado sem dados do veículo');
	}

	if (!vehicleModality && enriched.vehicle) {
		throw new Error('Seguro não veicular retornou dados de veículo');
	}

	let vehicle: DataExtract['vehicle'] = null;

	if (enriched.vehicle) {
		vehicle = SchemaVehicle.parse({
			plate: normalizePlate(enriched.vehicle.plate),

			model: enriched.vehicle.model,

			year: enriched.vehicle.year,

			usage: enriched.vehicle.usage,

			overnightStayPostalCode: enriched.vehicle.overnightStayPostalCode,

			driver: enriched.vehicle.driver,
		});
	}

	const renewal = enriched.renewal || Boolean(enriched.latestProposal?.trim());

	return SchemaDataExtract.parse({
		latestProposal: enriched.latestProposal?.trim() || null,

		renewal,

		modality: enriched.modality,

		insuranceCompany: company,

		insured: enriched.insured,

		vehicle,

		effectivedAt: enriched.effectivedAt,

		requestedAt: enriched.requestedAt,

		expirationAt: enriched.expirationAt,

		award: enriched.award,

		installments: enriched.installments,

		franchise: enriched.franchise,
	});
}

/**
 * ============================================================================
 * IA
 *
 * IMPORTANTE:
 *
 * NÃO existe retry aqui.
 *
 * runPdfExtraction já controla:
 * - tentativas;
 * - text-full;
 * - vision;
 * - fallbacks.
 *
 * Fazer retry aqui multiplicaria exponencialmente as chamadas.
 * ============================================================================
 */

async function askModel(
	{
		model,
		text,
		images,
	}: {
		model: string;
		text: string;
		images: Array<string>;
	},
	insuranceCompanies: Array<InsuranceCompanyRow>,
): Promise<DataExtract> {
	const prompt = mountPrompt(text, {
		insuranceCompanies: insuranceCompanies.map((company, index) => ({
			i: index + 1,

			name: company.name,

			cnpj: company.cnpj,
		})),

		imagesCount: images.length,
	});

	const response = await askJson({
		model,
		prompt,
		images,
	});

	const parsed = SchemaModelOutput.parse(response);

	return finalizeModelOutput(parsed, text, insuranceCompanies);
}

/**
 * ============================================================================
 * Complementação de nascimento
 * ============================================================================
 */

async function completeBirths(valid: DataExtract): Promise<DataExtract> {
	const lookup = async (registration: string): Promise<string | null> => {
		try {
			const document = isCPF(registration)
				? await documentByCPF(registration)
				: await documentByCNPJ(registration);

			return format(document.birth, 'dd/MM/yyyy');
		} catch (error) {
			console.warn(
				'[extract-pdf] consulta de nascimento falhou:',
				error instanceof Error ? error.message : error,
			);

			return null;
		}
	};

	const driver = valid.vehicle?.driver ?? null;

	const driverIsInsured =
		Boolean(driver) && valid.insured.registration === driver?.cpf;

	const needsDriverLookup =
		Boolean(driver) && !driver?.birth && !driverIsInsured;

	const [insuredBirth, driverBirth] = await Promise.all([
		valid.insured.birth
			? Promise.resolve(valid.insured.birth)
			: lookup(valid.insured.registration),

		needsDriverLookup && driver ? lookup(driver.cpf) : Promise.resolve(null),
	]);

	valid.insured.birth = insuredBirth ?? null;

	if (driver) {
		driver.birth = driverIsInsured
			? valid.insured.birth
			: (driver.birth ?? driverBirth ?? null);
	}

	return valid;
}

/**
 * ============================================================================
 * Extração
 * ============================================================================
 */

async function extractData(
	path: ArrayBuffer,
	insuranceCompanies: Array<InsuranceCompanyRow>,
) {
	const extracted = await runPdfExtraction({
		label: 'extract-pdf',

		buffer: path,

		ask: (input) => askModel(input, insuranceCompanies),
	});

	const lookupStarted = performance.now();

	const data = await completeBirths(extracted);

	console.log(
		`[extract-pdf] consultas de nascimento ${Math.round(
			performance.now() - lookupStarted,
		)}ms`,
	);

	return data;
}

/**
 * ============================================================================
 * Router
 * ============================================================================
 */

function registerRoutersServicesSafesExtractPDF(server: Server) {
	server.post(
		'/extract-pdf',

		zValidator(
			'form',
			z.object({
				file: z.file('Arquivo inválido'),
			}),
		),

		async (ctx) => {
			try {
				const { file } = ctx.req.valid('form');

				const buffer = await file.arrayBuffer();

				const hash = Bun.hash(buffer).toString(16);

				/**
				 * v8:
				 *
				 * - removido retry interno da IA;
				 * - removida segunda chamada da franquia;
				 * - uso PARTICULAR corrigido deterministicamente;
				 * - franquia extraída deterministicamente quando possível;
				 * - prêmio líquido extraído deterministicamente;
				 * - parcelas extraídas deterministicamente;
				 * - IA passa a ser fallback/interpretação semântica.
				 */
				const cacheKey = `pdf-extract:v8:${hash}`;

				const cached = await ctx.cache.get(cacheKey);

				let data: DataExtract | null = null;

				// if (cached) {
				// 	try {
				// 		data = SchemaDataExtract.parse(JSON.parse(cached));
				// 	} catch (error) {
				// 		console.warn(
				// 			'[extract-pdf] cache incompatível, executando nova extração:',
				// 			error instanceof Error ? error.message : error,
				// 		);
				// 	}
				// }

				if (!data) {
					const insuranceCompanies =
						await ctx.database.insuranceCompany.findMany({
							select: {
								id: true,

								name: true,

								cnpj: true,
							},

							orderBy: {
								name: 'asc',
							},
						});

					data = await extractData(buffer, insuranceCompanies);

					await ctx.cache.set(
						cacheKey,
						JSON.stringify(data),
						'EX',
						60 * 60 * 24,
					);
				}

				return ctx.json(data, 200);
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

export { registerRoutersServicesSafesExtractPDF };
