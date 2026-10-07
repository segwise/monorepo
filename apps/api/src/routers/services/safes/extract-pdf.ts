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
 * Tipos
 * ============================================================================
 */

type Modality = z.infer<typeof SchemaModality>;
type VehicleUsage = z.infer<typeof SchemaVehicleUsage>;

type InsuranceCompanyRow = {
	id: string;
	name: string;
	cnpj: string;
};

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

function parseLooseInteger(value: unknown): number | null {
	const number = parseLooseNumber(value);

	if (number === null || !Number.isInteger(number)) {
		return null;
	}

	return number;
}

function parseInstallments(value: unknown): number | null {
	if (typeof value === 'number') {
		return Number.isInteger(value) && value > 0 && value <= 60 ? value : null;
	}

	if (typeof value !== 'string') {
		return null;
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

		return Number.isInteger(parsed) && parsed > 0 && parsed <= 60
			? parsed
			: null;
	}

	const installmentMatch = normalized.match(
		/\b(\d{1,2})\s*(?:parcelas?|parc\.?)\b/,
	);

	if (installmentMatch?.[1]) {
		const parsed = Number(installmentMatch[1]);

		return Number.isInteger(parsed) && parsed > 0 && parsed <= 60
			? parsed
			: null;
	}

	if (/^\d{1,2}$/.test(normalized)) {
		const parsed = Number(normalized);

		return Number.isInteger(parsed) && parsed > 0 && parsed <= 60
			? parsed
			: null;
	}

	return null;
}

function parseYear(value: unknown): number | null {
	if (typeof value === 'number') {
		return Number.isInteger(value) && value >= 1900 && value <= 2100
			? value
			: null;
	}

	if (typeof value !== 'string') {
		return null;
	}

	const years = value.match(/\b(?:19|20)\d{2}\b/g);

	if (!years?.length) {
		return null;
	}

	/**
	 * Ex.:
	 *
	 * 2025 / 2026
	 *
	 * fabricação / modelo
	 */
	const year = Number(years.at(-1));

	return Number.isInteger(year) && year >= 1900 && year <= 2100 ? year : null;
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
	 * Evita interpretar chassi como placa.
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
 * Compactação do texto enviado para a IA
 *
 * Não precisamos mandar páginas inteiras de condições gerais, LGPD,
 * avisos legais etc. para o modelo.
 * ============================================================================
 */

function compactDocumentText(text: string): string {
	const lines = text.split(/\r?\n/);

	if (lines.length <= 100) {
		return text;
	}

	const keywords = [
		'segurado',
		'proponente',
		'cpf',
		'cnpj',
		'celular',
		'nascimento',
		'profissao',
		'ocupacao',
		'vigencia',
		'proposta',
		'apolice',
		'renovacao',
		'seguro novo',
		'veiculo',
		'placa',
		'chassi',
		'ano modelo',
		'uso:',
		'finalidade',
		'condutor',
		'pernoite',
		'franquia',
		'premio',
		'preco',
		'valor liquido',
		'iof',
		'juros',
		'parcel',
		'pagamento',
		'seguradora',
		'susep',
	];

	const keep = new Set<number>();

	/**
	 * Cabeçalhos e dados iniciais normalmente ficam
	 * nas primeiras linhas.
	 */
	for (let index = 0; index < Math.min(55, lines.length); index++) {
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

	/**
	 * Rodapé costuma conter a razão social real da seguradora.
	 */
	for (
		let index = Math.max(0, lines.length - 25);
		index < lines.length;
		index++
	) {
		keep.add(index);
	}

	const compacted = [...keep]
		.sort((a, b) => a - b)
		.map((index) => lines[index])
		.join('\n');

	return compacted;
}

/**
 * ============================================================================
 * Extrações determinísticas
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
		'Valor dos Juros',
		'Valor Juros',
		'Juros',
	]);

	let fees = extractMoneyNearLabels(text, ['Encargos Financeiros', 'Encargos']);

	/**
	 * MAPFRE:
	 *
	 * Prêmio Líquido Encargos IOF
	 * 2.630,37 0,00 194,13 2.824,50
	 * Prêmio Total
	 *
	 * Aqui a ordem da linha é mais confiável do que procurar
	 * números depois de cada label individualmente.
	 */
	const mapfreStart = text.search(/Pr[eê]mio\s+L[ií]quido\s+Encargos\s+IOF/i);

	if (mapfreStart >= 0) {
		const fragment = text.slice(mapfreStart, mapfreStart + 300);

		const values = extractMoneyValues(fragment);

		if (values.length >= 4) {
			liquid = values[0] ?? null;

			fees = values[1] ?? null;

			iof = values[2] ?? null;

			total = values[3] ?? null;
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

function extractInstallmentsFromText(text: string): number | null {
	const patterns = [
		/C[oó]digo\s+do\s+Plano[\s\S]{0,120}?\b(\d{1,2})\s*parc/i,
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

	if (/Forma\s+de\s+Pagamento[\s\S]{0,100}?(?:à vista|a vista)/i.test(text)) {
		return 1;
	}

	return null;
}

function extractVehicleUsageFromText(text: string): VehicleUsage | null {
	const match = text.match(
		/(?:^|\n)\s*(?:Uso|Finalidade\s+de\s+Uso)\s*:\s*([^\n\r]+)/i,
	);

	if (!match?.[1]) {
		return null;
	}

	const usage = normalizeSearchText(match[1]);

	if (
		usage.includes('aplicativo') ||
		usage.includes('uber') ||
		/\b99\b/.test(usage)
	) {
		return 'app_based_transport';
	}

	if (usage.includes('taxi')) {
		return 'taxi';
	}

	if (usage.includes('transporte publico')) {
		return 'public_transportation';
	}

	if (usage.includes('entrega') || usage.includes('delivery')) {
		return 'delivieries';
	}

	if (usage.includes('turismo')) {
		return 'tourism';
	}

	if (usage.includes('cliente') || usage.includes('fornecedor')) {
		return 'client_supplier_visits';
	}

	/**
	 * Regra do sistema da corretora.
	 */
	if (usage.includes('particular')) {
		return 'leisure_and_work';
	}

	if (usage.includes('lazer') && usage.includes('trabalho')) {
		return 'leisure_and_work';
	}

	if (usage.includes('lazer')) {
		return 'leisure';
	}

	return null;
}

function extractPrimaryFranchise(text: string): number | null {
	/**
	 * MAPFRE:
	 *
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
	 * 25% da Normal ... 1.716,59
	 * 50% da Obrigatória ... 3.837,09
	 */
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

	/**
	 * PDF Porto pode linearizar:
	 *
	 * R$ 1.973,00 (50% da ... Obrigatória)
	 */
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

	/**
	 * MAPFRE e outros com seção própria.
	 */
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

function resolveInsuranceCompanyIndex(
	text: string,
	companies: Array<InsuranceCompanyRow>,
	aiIndex: unknown,
): number | null {
	const documentDigits = text.replace(/\D/g, '');

	const matches = companies
		.map((company, index) => ({
			index: index + 1,

			cnpj: company.cnpj.replace(/\D/g, ''),
		}))
		.filter(
			(company) =>
				company.cnpj.length === 14 && documentDigits.includes(company.cnpj),
		);

	if (matches.length === 1) {
		return matches[0]?.index ?? null;
	}

	const parsed = parseLooseInteger(aiIndex);

	if (parsed !== null && parsed >= 1 && parsed <= companies.length) {
		return parsed;
	}

	return null;
}

function resolveModality(value: unknown, text: string): Modality | null {
	const parsed = SchemaModality.safeParse(value);

	if (parsed.success) {
		return parsed.data;
	}

	const normalized = normalizeSearchText(text.slice(0, 5000));

	if (
		normalized.includes('motocicleta') ||
		normalized.includes(' seguro moto')
	) {
		return 'motorcycle';
	}

	if (normalized.includes('caminhao')) {
		return 'truck';
	}

	if (
		normalized.includes('dados do veiculo') ||
		normalized.includes('seguro auto')
	) {
		return 'vehicle';
	}

	return null;
}

function resolveRenewal(value: unknown, text: string): boolean {
	if (/Tipo\s+de\s+Seguro\s*:\s*SEGURO\s+NOVO/i.test(text)) {
		return false;
	}

	if (
		/\bRENOVA[CÇ][AÃ]O\b/i.test(text) ||
		/\bAP[ÓO]LICE\s+ANTERIOR\b/i.test(text)
	) {
		return true;
	}

	return value === true;
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

		year: z.number('Ano do veículo inválido').int().min(1900).max(2100),

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
		latestProposal: z.string().min(1).toLowerCase().nullish(),

		renewal: z.boolean(),

		modality: SchemaModality,

		insuranceCompany: z
			.object({
				id: z.uuidv7(),

				name: SchemaName,

				cnpj: SchemaCNPJ,
			})
			.strict(),

		insured: z
			.object({
				name: SchemaName,

				registration: SchemaCPFOrCNPJ,

				phone: z
					.string()
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
		 * Sempre líquido.
		 */
		award: z.number().nonnegative(),

		installments: z.number().int().positive().max(60),

		franchise: z.number().nonnegative().nullish(),
	})
	.strict();

type DataExtract = z.infer<typeof SchemaDataExtract>;

/**
 * ============================================================================
 * Schema permissivo da IA
 *
 * Não queremos fazer outra chamada só porque o Haiku:
 * - adicionou campo extra;
 * - mandou ano como string;
 * - mandou índice como string;
 * - deixou um campo null.
 * ============================================================================
 */

const SchemaModelOutput = z
	.object({
		latestProposal: z.string().nullish(),

		renewal: z.boolean().nullish(),

		modality: z.string().nullish(),

		insuranceCompany: z.union([z.number(), z.string()]).nullish(),

		insured: z
			.object({
				name: z.string().nullish(),

				registration: z.string().nullish(),

				phone: z.string().nullish(),

				birth: z.string().nullish(),

				profession: z.string().nullish(),
			})
			.passthrough()
			.nullish(),

		vehicle: z
			.object({
				plate: z.string().nullish(),

				model: z.string().nullish(),

				year: z.union([z.number(), z.string()]).nullish(),

				usage: z.string().nullish(),

				overnightStayPostalCode: z.string().nullish(),

				driver: z
					.object({
						name: z.string().nullish(),

						cpf: z.string().nullish(),

						birth: z.string().nullish(),
					})
					.passthrough()
					.nullish(),
			})
			.passthrough()
			.nullish(),

		effectivedAt: z.string().nullish(),

		requestedAt: z.string().nullish(),

		expirationAt: z.string().nullish(),

		award: z.union([z.number(), z.string()]).nullish(),

		installments: z.union([z.number(), z.string()]).nullish(),

		franchise: z.union([z.number(), z.string()]).nullish(),
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
	{
		insuranceCompanies,
		imagesCount,
		hints,
	}: {
		insuranceCompanies: Array<{
			i: number;
			name: string;
			cnpj: string;
		}>;

		imagesCount: number;

		hints: {
			award: number | null;
			franchise: number | null;
			installments: number | null;
			usage: VehicleUsage | null;
			insuranceCompany: number | null;
		};
	},
): string {
	const companies = insuranceCompanies
		.map((company) => `${company.i}|${company.name}|${company.cnpj}`)
		.join('\n');

	return `Extraia os dados da proposta/apólice de seguro.${visionInstructions(imagesCount)}

Responda APENAS JSON minificado:
{"latestProposal":null,"renewal":false,"modality":"vehicle","insuranceCompany":1,"insured":{"name":"","registration":"","phone":"","birth":null,"profession":null},"vehicle":{"plate":null,"model":"","year":2026,"usage":"leisure_and_work","overnightStayPostalCode":"","driver":{"name":"","cpf":"","birth":null}},"effectivedAt":null,"requestedAt":"","expirationAt":"","award":0,"installments":1,"franchise":null}

Regras:
- insuranceCompany = índice da seguradora que EMITE o seguro; não banco/corretora.
- modality: carro=vehicle, moto=motorcycle, caminhão=truck.
- latestProposal é somente proposta/apólice ANTERIOR em renovação.
- placa tem 7 caracteres; nunca use chassi. Veículo sem placa => null.
- year = ano MODELO.
- Uso "PARTICULAR" => leisure_and_work.
- Somente "LAZER" => leisure.
- Uber/99 => app_based_transport.
- award = prêmio/preço LÍQUIDO, SEM IOF, juros ou encargos.
- "Prêmio Líquido Total" continua sendo líquido e é válido.
- installments = quantidade de parcelas; "à vista" = 1.
- franchise = franquia PRINCIPAL do casco; não prêmio da cobertura nem franquias de vidro/farol.
- driver = principal condutor.
- requestedAt = início da vigência; expirationAt = fim.
- effectivedAt somente se for apólice já emitida.
- Não invente dados.

Valores já detectados deterministicamente pelo sistema; prefira-os quando não houver conflito explícito no documento:
award=${hints.award ?? 'null'}
franchise=${hints.franchise ?? 'null'}
installments=${hints.installments ?? 'null'}
usage=${hints.usage ?? 'null'}
insuranceCompany=${hints.insuranceCompany ?? 'null'}

Seguradoras:
${companies}

Documento:
"""
${text}
"""`;
}

/**
 * ============================================================================
 * Conversão/finalização
 * ============================================================================
 */

function isVehicleModality(modality: Modality): boolean {
	return (
		modality === 'vehicle' || modality === 'motorcycle' || modality === 'truck'
	);
}

function finalizeModelOutput(
	raw: ModelOutput,
	fullText: string,
	insuranceCompanies: Array<InsuranceCompanyRow>,
): DataExtract {
	const financial = extractFinancialSummary(fullText);

	const award = financial.liquid ?? parseLooseNumber(raw.award);

	if (award === null) {
		throw new Error('Não foi possível determinar o prêmio líquido');
	}

	const installments =
		extractInstallmentsFromText(fullText) ??
		parseInstallments(raw.installments);

	if (installments === null) {
		throw new Error('Não foi possível determinar a quantidade de parcelas');
	}

	const franchise =
		extractPrimaryFranchise(fullText) ?? parseLooseNumber(raw.franchise);

	const insuranceCompanyIndex = resolveInsuranceCompanyIndex(
		fullText,
		insuranceCompanies,
		raw.insuranceCompany,
	);

	if (insuranceCompanyIndex === null) {
		throw new Error('Não foi possível identificar a seguradora');
	}

	const insuranceCompany = insuranceCompanies[insuranceCompanyIndex - 1];

	if (!insuranceCompany) {
		throw new Error('Seguradora inválida');
	}

	const modality = resolveModality(raw.modality, fullText);

	if (!modality) {
		throw new Error('Não foi possível identificar a modalidade do seguro');
	}

	if (!raw.insured) {
		throw new Error('Dados do segurado não identificados');
	}

	const vehicleModality = isVehicleModality(modality);

	let vehicle: DataExtract['vehicle'] = null;

	if (vehicleModality) {
		if (!raw.vehicle) {
			throw new Error('Dados do veículo não identificados');
		}

		const usageFromText = extractVehicleUsageFromText(fullText);

		const aiUsage = SchemaVehicleUsage.safeParse(raw.vehicle.usage);

		const usage = usageFromText ?? (aiUsage.success ? aiUsage.data : null);

		if (!usage) {
			throw new Error('Uso do veículo não identificado');
		}

		const year = parseYear(raw.vehicle.year);

		if (year === null) {
			throw new Error('Ano modelo não identificado');
		}

		if (!raw.vehicle.model || !raw.vehicle.overnightStayPostalCode) {
			throw new Error('Dados obrigatórios do veículo não identificados');
		}

		let driver: z.infer<typeof SchemaVehicle>['driver'] = null;

		if (raw.vehicle.driver) {
			if (raw.vehicle.driver.name && raw.vehicle.driver.cpf) {
				driver = {
					name: raw.vehicle.driver.name,

					cpf: raw.vehicle.driver.cpf,

					birth: raw.vehicle.driver.birth ?? null,
				};
			}
		}

		vehicle = SchemaVehicle.parse({
			plate: normalizePlate(raw.vehicle.plate),

			model: raw.vehicle.model,

			year,

			usage,

			overnightStayPostalCode: raw.vehicle.overnightStayPostalCode,

			driver,
		});
	}

	const latestProposal = raw.latestProposal?.trim() || null;

	const renewal =
		resolveRenewal(raw.renewal, fullText) || Boolean(latestProposal);

	return SchemaDataExtract.parse({
		latestProposal,

		renewal,

		modality,

		insuranceCompany,

		insured: {
			name: raw.insured.name,

			registration: raw.insured.registration,

			phone: raw.insured.phone,

			birth: raw.insured.birth ?? null,

			profession: raw.insured.profession ?? null,
		},

		vehicle,

		effectivedAt: raw.effectivedAt ?? null,

		requestedAt: raw.requestedAt,

		expirationAt: raw.expirationAt,

		award,

		installments,

		franchise,
	});
}

/**
 * ============================================================================
 * IA
 *
 * Uma única chamada por execução de ask().
 * O runPdfExtraction decide se realmente precisa tentar outra estratégia.
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
	const compactText = compactDocumentText(text);

	const financial = extractFinancialSummary(text);

	const deterministicCompany = resolveInsuranceCompanyIndex(
		text,
		insuranceCompanies,
		null,
	);

	const prompt = mountPrompt(compactText, {
		insuranceCompanies: insuranceCompanies.map((company, index) => ({
			i: index + 1,

			name: company.name,

			cnpj: company.cnpj,
		})),

		imagesCount: images.length,

		hints: {
			award: financial.liquid,

			franchise: extractPrimaryFranchise(text),

			installments: extractInstallmentsFromText(text),

			usage: extractVehicleUsageFromText(text),

			insuranceCompany: deterministicCompany,
		},
	});

	const started = performance.now();

	try {
		const response = await askJson({
			model,
			prompt,
			images,
		});

		const raw = SchemaModelOutput.parse(response);

		const result = finalizeModelOutput(raw, text, insuranceCompanies);

		console.log(
			`[extract-pdf] ask aceito ${Math.round(
				performance.now() - started,
			)}ms texto=${text.length} compactado=${compactText.length}`,
		);

		return result;
	} catch (error) {
		console.warn(
			'[extract-pdf] ask rejeitado:',
			error instanceof Error ? error.message : error,
		);

		throw error;
	}
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

				const cacheKey = `pdf-extract:v9:${hash}`;

				const cached = await ctx.cache.get(cacheKey);

				let data: DataExtract | null = null;

				// if (cached) {
				// 	try {
				// 		data =
				// 			SchemaDataExtract.parse(
				// 				JSON.parse(
				// 					cached,
				// 				),
				// 			);
				// 	} catch {
				// 		data =
				// 			null;
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
