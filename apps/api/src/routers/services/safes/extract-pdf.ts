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

	const installmentMatch = normalized.match(
		/\b(\d{1,2})\s*(?:parcelas?|parc\.?)\b/,
	);

	if (installmentMatch?.[1]) {
		const parsed = Number(installmentMatch[1]);

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

	if (normalized.length !== 7) {
		return null;
	}

	return normalized;
}

function numericValuesFromText(text: string): number[] {
	const matches =
		text.match(/-?\d+(?:\.\d{3})*(?:,\d+)?|-?\d+(?:\.\d+)?/g) ?? [];

	return matches
		.map((value) => parseBrazilianNumber(value))
		.filter(
			(value): value is number =>
				typeof value === 'number' && Number.isFinite(value),
		);
}

function evidenceContainsValue(
	evidence: string | null | undefined,
	value: number,
	tolerance = 0.02,
): boolean {
	if (!evidence) {
		return false;
	}

	const absoluteValue = Math.abs(value);

	return numericValuesFromText(evidence).some(
		(candidate) => Math.abs(Math.abs(candidate) - absoluteValue) <= tolerance,
	);
}

function moneyAlmostEqual(a: number, b: number, tolerance = 0.05): boolean {
	return Math.abs(a - b) <= tolerance;
}

function errorMessage(error: unknown): string {
	return error instanceof Error
		? error.message
		: 'Falha desconhecida na validação';
}

/**
 * ============================================================================
 * Schema final
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
		 * Valor líquido REAL da proposta/apólice.
		 *
		 * Não inclui:
		 * - IOF;
		 * - juros;
		 * - encargos financeiros.
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

const SchemaModelInstallmentsNullable = SchemaModelInstallments.nullable();

const SchemaModelYear = z.preprocess(
	parseYear,
	z.number().int().min(1900).max(2100),
);

const SchemaModelOutput = z
	.object({
		latestProposal: z.string().nullable(),

		renewal: z.boolean(),

		modality: SchemaModality,

		insuranceCompany: z.number('Seguradora inválida').int().min(1),

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

		/**
		 * Valor líquido do produto.
		 */
		award: SchemaModelMoneyNullable,

		awardEvidence: z.string().nullable(),

		/**
		 * Campos auxiliares de pagamento.
		 *
		 * Não são retornados pela API.
		 */
		totalPremium: SchemaModelMoneyNullable,

		totalPremiumEvidence: z.string().nullable(),

		iof: SchemaModelMoneyNullable,

		interest: SchemaModelMoneyNullable,

		fees: SchemaModelMoneyNullable,

		installments: SchemaModelInstallmentsNullable,

		installmentsEvidence: z.string().nullable(),

		franchise: SchemaModelMoneyNullable,

		franchiseEvidence: z.string().nullable(),
	})
	.strict();

type ModelOutput = z.infer<typeof SchemaModelOutput>;

/**
 * ============================================================================
 * Franquia especializada
 * ============================================================================
 */

const SchemaFranchiseVerification = z
	.object({
		franchise: SchemaModelMoneyNullable,

		coveragePremium: SchemaModelMoneyNullable,

		indemnityLimit: SchemaModelMoneyNullable,

		franchiseBasis: z.string().nullable(),

		evidence: z.string().nullable(),
	})
	.strict();

type FranchiseVerification = z.infer<typeof SchemaFranchiseVerification>;

/**
 * ============================================================================
 * Prompt principal
 * ============================================================================
 */

function mountPrompt(
	text: string,
	{
		database: { insuranceCompanies },
		imagesCount,
	}: {
		database: {
			insuranceCompanies: Array<{
				i: number;
				name: string;
				cnpj: string;
			}>;
		};

		imagesCount: number;
	},
): string {
	return `
Extraia os dados da PROPOSTA ou APÓLICE DE SEGURO abaixo.

O documento pode ser de QUALQUER seguradora e possuir qualquer layout.

${visionInstructions(imagesCount)}

IMPORTANTE

O texto foi extraído automaticamente de um PDF e pode perder a estrutura
das tabelas.

Quando imagens estiverem disponíveis, utilize também a estrutura VISUAL.

Quando texto e imagem parecerem contraditórios, prefira a estrutura visual.

Analise TODO o documento antes de responder.

FORMATO

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
	"awardEvidence": "string ou null",
	"totalPremium": "number ou null",
	"totalPremiumEvidence": "string ou null",
	"iof": "number ou null",
	"interest": "number ou null",
	"fees": "number ou null",
	"installments": "number ou null",
	"installmentsEvidence": "string ou null",
	"franchise": "number ou null",
	"franchiseEvidence": "string ou null"
}

SEGURADORA

"insuranceCompany" é o índice da empresa que efetivamente EMITE/GARANTE
o seguro.

Não confunda com:
- corretora;
- banco;
- distribuidor;
- parceiro;
- estipulante.

Priorize:
- CNPJ;
- código SUSEP;
- "seguro garantido por";
- dados jurídicos da seguradora.

Lista:

${JSON.stringify(insuranceCompanies)}

RENOVAÇÃO

renewal = true quando houver:
- renovação;
- renovação congênere;
- apólice anterior;
- código CI;
- seguradora anterior.

latestProposal =
identificação da proposta/apólice ANTERIOR.

Nunca use número atual.

MODALIDADE

carro/utilitário => vehicle
moto => motorcycle
caminhão => truck
saúde => health
residência => residence
empresa => business
condomínio => condominium
viagem => travel
profissional => professional
construção => construction

PLACA

Placa brasileira normalmente possui 7 caracteres.
Chassi normalmente possui 17.

Nunca confunda os dois.

"-", "A AVISAR", "SEM PLACA" => null.

ANO

Use o ano MODELO.

2025 / 2026 => 2026.

VALOR DA PROPOSTA / award

REGRA CRÍTICA:

"award" representa o VALOR LÍQUIDO REAL DO PRODUTO NEGOCIADO.

É o prêmio/preço líquido ANTES de:
- IOF;
- juros;
- encargos financeiros;
- acréscimos decorrentes da forma de pagamento.

Esse é o valor relevante para a corretora.

Rótulos possíveis:

- Prêmio Líquido
- Prêmio Líquido Total
- Preço Líquido
- Valor Líquido
- Total Líquido
- Prêmio Líquido do Seguro

"Prêmio Líquido Total" É válido.

A palavra "Total" nesse rótulo representa normalmente a soma dos
prêmios líquidos das coberturas.

Não significa valor final com IOF.

EXEMPLO ALLIANZ

Preço Líquido: R$ 36,57
IOF: R$ 2,70
Preço Total: R$ 39,27

Resultado:

"award": 36.57
"totalPremium": 39.27
"iof": 2.70

NUNCA use 39.27 em award neste exemplo.

EXEMPLO TOKIO

Prêmio Líquido Total: R$ 4.247,70
Juros: R$ 0,00
IOF: R$ 313,47
Prêmio Total: R$ 4.561,17

Resultado:

"award": 4247.70
"totalPremium": 4561.17
"iof": 313.47
"interest": 0

EXEMPLO PORTO

Valor líquido: R$ 1.222,11
IOF: R$ 90,19
Juros: R$ 0,00
Encargos: R$ 0,00
Valor total: R$ 1.312,30

Resultado:

"award": 1222.11
"totalPremium": 1312.30
"iof": 90.19
"interest": 0
"fees": 0

NÃO use em award:
- prêmio total;
- preço total;
- valor total com impostos;
- IOF;
- juros;
- encargos;
- valor da parcela;
- prêmio individual de cobertura;
- franquia;
- LMI;
- FIPE.

"awardEvidence":
trecho contendo o valor líquido escolhido.

"totalPremium":
valor financeiro final incluindo IOF/juros/encargos.

Esse campo serve SOMENTE para validação.

"totalPremiumEvidence":
trecho contendo esse total.

"iof":
IOF.

"interest":
juros.

"fees":
encargos.

PARCELAS

installments = somente quantidade de parcelas.

à vista => 1
10x => 10
12 parcelas => 12
12 parc => 12

FRANQUIA

franchise = FRANQUIA PRINCIPAL DO CASCO.

Uma tabela pode conter:

Descrição | LMI | Franquia | Valor do Prêmio

EXEMPLO:

Compreensiva | 100% | R$ 1.973,00 (50% da Obrigatória) | R$ 1.071,27

CORRETO:

franchise = 1973

ERRADO:

franchise = 1071.27

Quando o texto perder a estrutura, confira a IMAGEM.

Não use franquias de:
- vidro;
- farol;
- lanterna;
- retrovisor;
- roda;
- pneu.

DATAS

requestedAt = início da vigência.
expirationAt = fim da vigência.

effectivedAt:
data de efetivação apenas quando for apólice efetivamente emitida.

Proposta ainda não emitida => null.

REGRAS

- Apenas JSON válido.
- Uma linha.
- Sem markdown.
- Todo number deve ser number.
- R$ 1.234,56 => 1234.56
- Não invente dados.

Texto:

"""
${text}
"""
`;
}

/**
 * ============================================================================
 * Prompt especializado da franquia
 * ============================================================================
 */

function mountFranchiseVerificationPrompt(
	text: string,
	imagesCount: number,
): string {
	return `
Sua única tarefa é identificar a FRANQUIA PRINCIPAL DO CASCO.

${visionInstructions(imagesCount)}

Quando imagens estiverem disponíveis, INSPECIONE VISUALMENTE a tabela.

Diferencie:

1. LMI
2. Franquia
3. Valor do Prêmio

EXEMPLO:

Descrição | LMI | Franquia | Valor do Prêmio

Compreensiva | 100% | R$ 1.973,00 (50% da Obrigatória) | R$ 1.071,27

Resultado:

{
	"franchise": 1973,
	"coveragePremium": 1071.27,
	"indemnityLimit": null,
	"franchiseBasis": "50% da Obrigatória",
	"evidence": "Descrição | LMI | Franquia | Valor do Prêmio ... R$ 1.973,00 ... R$ 1.071,27"
}

NUNCA use 1071.27 como franquia neste exemplo.

Responda apenas JSON minificado:

{
	"franchise": "number ou null",
	"coveragePremium": "number ou null",
	"indemnityLimit": "number ou null",
	"franchiseBasis": "string ou null",
	"evidence": "string ou null"
}

Texto:

"""
${text}
"""
`;
}

function mountFranchiseRetryPrompt(
	basePrompt: string,
	previous: unknown,
	reason: string,
): string {
	return `
${basePrompt}

Resposta anterior inconsistente.

Motivo:

${reason}

Resposta anterior:

${JSON.stringify(previous)}

Revise principalmente a posição visual das colunas:
- Franquia
- Valor do Prêmio
- LMI

Retorne somente o JSON corrigido.
`;
}

function mountRetryPrompt(
	basePrompt: string,
	previous: unknown,
	reason: string,
): string {
	return `
${basePrompt}

A extração anterior foi inconsistente.

Motivo:

${reason}

Resposta anterior:

${JSON.stringify(previous)}

REGRA CRÍTICA:

award deve ser sempre o valor LÍQUIDO do seguro.

IOF, juros e encargos pertencem ao pagamento e NÃO entram em award.

Quando houver:

Preço Líquido: 36,57
IOF: 2,70
Preço Total: 39,27

award = 36.57

Revise o documento e retorne somente o JSON completo corrigido.
`;
}

/**
 * ============================================================================
 * Validação da franquia
 * ============================================================================
 */

function validateFranchiseVerification(
	verification: FranchiseVerification,
): void {
	if (verification.franchise === null) {
		return;
	}

	if (!verification.evidence) {
		throw new Error('Franquia identificada sem evidência');
	}

	if (!evidenceContainsValue(verification.evidence, verification.franchise)) {
		throw new Error('A evidência não confirma a franquia');
	}

	if (!/(franqui|obrigat|participa[cç][aã]o)/i.test(verification.evidence)) {
		throw new Error('A evidência não possui contexto suficiente de franquia');
	}

	if (
		verification.coveragePremium !== null &&
		moneyAlmostEqual(verification.franchise, verification.coveragePremium)
	) {
		throw new Error(
			'Franquia e prêmio da cobertura foram identificados com o mesmo valor',
		);
	}
}

async function verifyFranchise({
	model,
	text,
	images,
}: {
	model: string;
	text: string;
	images: Array<string>;
}): Promise<FranchiseVerification> {
	const prompt = mountFranchiseVerificationPrompt(text, images.length);

	let previous: unknown;

	try {
		previous = await askJson({
			model,
			prompt,
			images,
		});

		const parsed = SchemaFranchiseVerification.parse(previous);

		validateFranchiseVerification(parsed);

		return parsed;
	} catch (firstError) {
		const reason = errorMessage(firstError);

		console.warn(
			'[extract-pdf] primeira verificação de franquia inconsistente:',
			reason,
		);

		const retried = await askJson({
			model,

			prompt: mountFranchiseRetryPrompt(prompt, previous, reason),

			images,
		});

		const parsed = SchemaFranchiseVerification.parse(retried);

		validateFranchiseVerification(parsed);

		return parsed;
	}
}

/**
 * ============================================================================
 * Validação financeira
 * ============================================================================
 */

function validateFinancialExtraction(raw: ModelOutput): void {
	if (raw.award === null) {
		throw new Error('Não foi possível determinar o prêmio líquido da proposta');
	}

	if (!raw.awardEvidence) {
		throw new Error('Prêmio líquido identificado sem evidência');
	}

	if (!evidenceContainsValue(raw.awardEvidence, raw.award)) {
		throw new Error('A evidência não confirma o prêmio líquido');
	}

	if (raw.installments === null) {
		throw new Error('Não foi possível determinar a quantidade de parcelas');
	}

	if (!raw.installmentsEvidence) {
		throw new Error('Quantidade de parcelas identificada sem evidência');
	}

	if (
		!evidenceContainsValue(raw.installmentsEvidence, raw.installments, 0.001)
	) {
		throw new Error('A evidência não confirma a quantidade de parcelas');
	}

	/**
	 * Detecta award confundido com prêmio total.
	 */
	if (
		raw.totalPremium !== null &&
		moneyAlmostEqual(raw.award, raw.totalPremium) &&
		((raw.iof ?? 0) > 0 || (raw.interest ?? 0) > 0 || (raw.fees ?? 0) > 0)
	) {
		throw new Error(
			'O prêmio líquido foi confundido com o prêmio total incluindo IOF, juros ou encargos',
		);
	}

	if (
		raw.totalPremium !== null &&
		raw.iof !== null &&
		raw.interest !== null &&
		raw.fees !== null
	) {
		const expected = raw.award + raw.iof + raw.interest + raw.fees;

		if (!moneyAlmostEqual(expected, raw.totalPremium)) {
			throw new Error(
				`Valores financeiros inconsistentes: líquido ${raw.award}, IOF ${raw.iof}, juros ${raw.interest}, encargos ${raw.fees}, total ${raw.totalPremium}`,
			);
		}
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
	insuranceCompanies: Array<InsuranceCompanyRow>,
): DataExtract {
	validateFinancialExtraction(raw);

	if (raw.award === null || raw.installments === null) {
		throw new Error('Informações financeiras obrigatórias ausentes');
	}

	const company = insuranceCompanies[raw.insuranceCompany - 1];

	if (!company) {
		throw new Error('Seguradora não encontrada na lista');
	}

	const vehicleModality = isVehicleModality(raw.modality);

	if (vehicleModality && !raw.vehicle) {
		throw new Error('Seguro veicular identificado sem veículo');
	}

	if (!vehicleModality && raw.vehicle) {
		throw new Error('Seguro não veicular retornou veículo');
	}

	let vehicle: DataExtract['vehicle'] = null;

	if (raw.vehicle) {
		vehicle = SchemaVehicle.parse({
			plate: normalizePlate(raw.vehicle.plate),

			model: raw.vehicle.model,

			year: raw.vehicle.year,

			usage: raw.vehicle.usage,

			overnightStayPostalCode: raw.vehicle.overnightStayPostalCode,

			driver: raw.vehicle.driver,
		});
	}

	const renewal = raw.renewal || Boolean(raw.latestProposal?.trim());

	return SchemaDataExtract.parse({
		latestProposal: raw.latestProposal?.trim() || null,

		renewal,

		modality: raw.modality,

		insuranceCompany: company,

		insured: raw.insured,

		vehicle,

		effectivedAt: raw.effectivedAt,

		requestedAt: raw.requestedAt,

		expirationAt: raw.expirationAt,

		award: raw.award,

		installments: raw.installments,

		franchise: raw.franchise,
	});
}

/**
 * ============================================================================
 * IA
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
		database: {
			insuranceCompanies: insuranceCompanies.map((company, index) => ({
				i: index + 1,
				name: company.name,
				cnpj: company.cnpj,
			})),
		},

		imagesCount: images.length,
	});

	let previous: unknown;
	let parsed: ModelOutput;

	try {
		previous = await askJson({
			model,
			prompt,
			images,
		});

		parsed = SchemaModelOutput.parse(previous);

		validateFinancialExtraction(parsed);
	} catch (firstError) {
		const reason = errorMessage(firstError);

		console.warn('[extract-pdf] primeira extração inconsistente:', reason);

		const retried = await askJson({
			model,

			prompt: mountRetryPrompt(prompt, previous, reason),

			images,
		});

		parsed = SchemaModelOutput.parse(retried);

		validateFinancialExtraction(parsed);
	}

	if (isVehicleModality(parsed.modality)) {
		const verification = await verifyFranchise({
			model,
			text,
			images,
		});

		parsed = {
			...parsed,

			franchise: verification.franchise,

			franchiseEvidence: verification.evidence,
		};
	} else {
		parsed = {
			...parsed,

			franchise: null,

			franchiseEvidence: null,
		};
	}

	return finalizeModelOutput(parsed, insuranceCompanies);
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
				 * v7:
				 *
				 * - award sempre líquido;
				 * - IOF/juros/encargos excluídos do valor da corretora;
				 * - total financeiro somente como validação;
				 * - detecção automática de total confundido com líquido;
				 * - verificação especializada da franquia.
				 */
				const cacheKey = `pdf-extract:v7:${hash}`;

				const cached = await ctx.cache.get(cacheKey);

				let data: DataExtract | null = null;

				if (cached) {
					try {
						data = SchemaDataExtract.parse(JSON.parse(cached));
					} catch (error) {
						console.warn(
							'[extract-pdf] cache incompatível, executando nova extração:',
							error instanceof Error ? error.message : error,
						);
					}
				}

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
