import { zValidator } from '@hono/zod-validator';
import {
	isCPF,
	maskNumber,
	SchemaCNPJ,
	SchemaCPF,
	SchemaCPFOrCNPJ,
	SchemaDateString,
	SchemaName,
	SchemaPhone,
	SchemaPostalCode,
	SchemaVehicleUsage,
} from '@segwise/core';
import { format } from 'date-fns';
import { z } from 'zod';
import type { Server } from '@/@types/server';
import { documentByCPF } from '@/functions/document/by-cpf';
import {
	AIProviderError,
	askJson,
	runPdfExtraction,
	SchemaPlateLenient,
	visionInstructions,
} from '@/libraries/ai/pdf-extraction';

type InsuranceCompanyRow = { id: string; name: string; cnpj: string };

const MONEY_TOLERANCE = 0.05;

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

function parseInteger(value: unknown): unknown {
	if (typeof value === 'number') {
		return Number.isInteger(value) ? value : value;
	}

	if (typeof value !== 'string') {
		return value;
	}

	const parsed = Number(value.trim());

	return Number.isInteger(parsed) ? parsed : value;
}

function normalizeText(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function normalizeBrazilianPhone(value: string): string {
	let phone = maskNumber(value);

	if (phone.startsWith('00')) {
		phone = phone.slice(2);
	}

	if (phone.length === 13 && phone.startsWith('55')) {
		phone = phone.slice(2);
	}

	return phone;
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

	return numericValuesFromText(evidence).some(
		(candidate) => Math.abs(candidate - value) <= tolerance,
	);
}

function digitsOnly(value: string): string {
	return value.replace(/\D/g, '');
}

function evidenceContainsRegistration(
	evidence: string | null | undefined,
	registration: string,
): boolean {
	if (!evidence) {
		return false;
	}

	const expected = digitsOnly(registration);

	return expected.length > 0 && digitsOnly(evidence).includes(expected);
}

function sourceContainsRegistrationNear(
	sourceText: string,
	registration: string,
	keywords: Array<string>,
	radius = 4,
): boolean {
	const expected = digitsOnly(registration);

	if (!expected) {
		return false;
	}

	const lines = sourceText.split('\n');

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? '';
		const normalizedLine = normalizeText(line);

		if (!keywords.some((keyword) => normalizedLine.includes(keyword))) {
			continue;
		}

		const start = Math.max(0, index - radius);
		const end = Math.min(lines.length, index + radius + 1);
		const block = lines.slice(start, end).join(' ');

		if (digitsOnly(block).includes(expected)) {
			return true;
		}
	}

	return false;
}

function sourceContainsPhoneNear(
	sourceText: string,
	phone: string,
	keywords: Array<string>,
	radius = 3,
): boolean {
	const expected = normalizeBrazilianPhone(phone);

	if (!expected) {
		return false;
	}

	const lines = sourceText.split('\n');

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? '';
		const normalizedLine = normalizeText(line);

		if (!keywords.some((keyword) => normalizedLine.includes(keyword))) {
			continue;
		}

		const start = Math.max(0, index - radius);
		const end = Math.min(lines.length, index + radius + 1);
		const blockDigits = digitsOnly(lines.slice(start, end).join(' '));

		if (blockDigits.includes(expected)) {
			return true;
		}

		if (expected.startsWith('55') && blockDigits.includes(expected.slice(2))) {
			return true;
		}
	}

	return false;
}

function evidenceContainsDate(
	evidence: string | null | undefined,
	date: string,
): boolean {
	if (!evidence) {
		return false;
	}

	const compactEvidence = evidence.replace(/[^0-9]/g, '');
	const compactDate = date.replace(/[^0-9]/g, '');

	return compactEvidence.includes(compactDate);
}

function evidenceSupportsInstallments(
	evidence: string | null | undefined,
	installments: number,
): boolean {
	if (!evidence) {
		return false;
	}

	const normalized = normalizeText(evidence);

	const directPatterns = [
		new RegExp(`\\b${installments}\\s*x\\b`, 'i'),
		new RegExp(`\\b${installments}\\s*parc(?:ela)?s?\\b`, 'i'),
		new RegExp(`parcelas?\\s*[:=-]?\\s*${installments}\\b`, 'i'),
		new RegExp(
			`numero\\s+de\\s+parcelas?\\s*[:=-]?\\s*${installments}\\b`,
			'i',
		),
		new RegExp(
			`quant(?:idade)?\\.?\\s*parcelas?\\s*[:=-]?\\s*${installments}\\b`,
			'i',
		),
	];

	if (directPatterns.some((pattern) => pattern.test(normalized))) {
		return true;
	}

	const split = evidence.match(/\b(\d{1,2})\s*\+\s*(\d{1,2})\b/);

	if (split) {
		const first = Number(split[1]);
		const second = Number(split[2]);

		if (first + second === installments) {
			return true;
		}
	}

	return false;
}

function companyEvidenceMatches(
	companyName: string,
	evidence: string,
): boolean {
	const company = normalizeText(companyName);
	const source = normalizeText(evidence);

	const stopWords = new Set([
		'seguro',
		'seguros',
		'seguradora',
		'companhia',
		'cia',
		'brasil',
		'gerais',
		'geral',
		'participacoes',
		'participacao',
		'servicos',
		'tecnicos',
		'administrativos',
		'corretagem',
		'de',
		'da',
		'do',
		'das',
		'dos',
		'e',
		's',
		'a',
		'sa',
	]);

	const tokens = company
		.split(' ')
		.filter((token) => token && !stopWords.has(token));

	return tokens.some((token) => source.includes(token));
}

function franchiseEvidenceLooksPrincipal(evidence: string): boolean {
	const normalized = normalizeText(evidence);

	const strongPrincipal =
		/\b(casco|compreensiva|basica|obrigatoria|participacao obrigatoria|indenizacao parcial do veiculo|franquia do veiculo|normal|reduzida|facultativa)\b/.test(
			normalized,
		);

	if (strongPrincipal) {
		return true;
	}

	const accessory =
		/\b(vidro|vidros|para brisa|parabrisa|farol|farois|lanterna|lanternas|retrovisor|retrovisores|vigia|lateral|laterais|teto solar|pneu|pneus|roda|rodas|martelinho|para choque|maquina de vidro|kit gas|assistencia)\b/.test(
			normalized,
		);

	return !accessory && /\bfranquia\b/.test(normalized);
}

function sourceSupportsPrincipalFranchise(
	sourceText: string,
	value: number,
	radius = 3,
): boolean {
	const lines = sourceText.split('\n');

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? '';

		if (
			!numericValuesFromText(line).some(
				(candidate) => Math.abs(candidate - value) <= MONEY_TOLERANCE,
			)
		) {
			continue;
		}

		const start = Math.max(0, index - radius);
		const end = Math.min(lines.length, index + radius + 1);
		const block = lines.slice(start, end).join(' ');

		if (franchiseEvidenceLooksPrincipal(block)) {
			return true;
		}
	}

	return false;
}

function sum(values: number[]): number {
	return values.reduce((total, value) => total + value, 0);
}

function assertClose(actual: number, expected: number, message: string): void {
	if (Math.abs(actual - expected) > MONEY_TOLERANCE) {
		throw new Error(message);
	}
}

const SchemaSupportedModality = z.enum(['vehicle', 'motorcycle']);

const SchemaMobilePhone = z
	.string('Celular inválido')
	.transform(normalizeBrazilianPhone)
	.refine(
		(value) => value.length === 11 && value[2] === '9',
		'Celular inválido',
	)
	.pipe(SchemaPhone);

const SchemaDataExtract = z
	.object({
		latestProposal: z
			.string('Código da proposta anterior inválido')
			.trim()
			.min(1, 'Código da proposta anterior inválido')
			.toLowerCase()
			.nullable(),
		renewal: z.boolean('Status de renovação inválido'),
		modality: SchemaSupportedModality,
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
				phone: SchemaMobilePhone,
				birth: SchemaDateString.nullable(),
				profession: z.string().trim().min(1).nullable(),
			})
			.strict(),
		vehicle: z
			.object({
				plate: SchemaPlateLenient,
				model: z.string('Modelo do veículo inválido').trim().min(1),
				year: z
					.number('Ano do modelo inválido')
					.int('Ano do modelo inválido')
					.min(1900, 'Ano do modelo inválido')
					.max(2100, 'Ano do modelo inválido'),
				usage: SchemaVehicleUsage,
				overnightStayPostalCode: SchemaPostalCode,
				driver: z
					.object({
						name: SchemaName,
						cpf: SchemaCPF,
						birth: SchemaDateString.nullable(),
					})
					.strict(),
			})
			.strict(),
		effectivedAt: SchemaDateString.nullable(),
		requestedAt: SchemaDateString,
		expirationAt: SchemaDateString,
		award: z
			.number('Prêmio líquido inválido')
			.positive('Prêmio líquido inválido'),
		installments: z
			.number('Quantidade de parcelas inválida')
			.int('Quantidade de parcelas inválida')
			.min(1, 'Quantidade de parcelas inválida')
			.max(60, 'Quantidade de parcelas inválida'),
		franchise: z.number('Franquia inválida').positive('Franquia inválida'),
	})
	.strict();

type DataExtract = z.infer<typeof SchemaDataExtract>;

const SchemaModelMoneyNullable = z.preprocess(
	parseBrazilianNumber,
	z.number().finite().nullable(),
);

const SchemaModelIntegerNullable = z.preprocess(
	parseInteger,
	z.number().int().nullable(),
);

const SchemaModelOutput = z
	.object({
		documentKind: z.enum(['proposal', 'policy', 'endorsement', 'unknown']),
		latestProposal: z.string().nullable(),
		renewal: z.boolean().nullable(),
		renewalEvidence: z.string().nullable(),
		modality: z.enum(['vehicle', 'motorcycle', 'unsupported', 'unknown']),
		modalityEvidence: z.string().nullable(),
		insuranceCompany: z
			.object({
				index: z.number().int().min(1).nullable(),
				basis: z.enum(['commercial_brand', 'legal_issuer']).nullable(),
				evidence: z.string().nullable(),
			})
			.strict(),
		insured: z
			.object({
				name: z.string().nullable(),
				registration: z.string().nullable(),
				phone: z.string().nullable(),
				birth: z.string().nullable(),
				profession: z.string().nullable(),
				evidence: z.string().nullable(),
				phoneEvidence: z.string().nullable(),
			})
			.strict(),
		vehicle: z
			.object({
				plate: z.string().nullable(),
				plateStatus: z.enum(['present', 'explicitly_absent', 'unknown']),
				plateEvidence: z.string().nullable(),
				model: z.string().nullable(),
				year: SchemaModelIntegerNullable,
				usage: z
					.enum([
						'leisure_and_work',
						'leisure',
						'client_supplier_visits',
						'app_based_transport',
						'taxi',
						'public_transportation',
						'delivieries',
						'tourism',
					])
					.nullable(),
				overnightStayPostalCode: z.string().nullable(),
				driver: z
					.object({
						name: z.string().nullable(),
						cpf: z.string().nullable(),
						birth: z.string().nullable(),
						evidence: z.string().nullable(),
					})
					.strict()
					.nullable(),
			})
			.strict(),
		vigency: z
			.object({
				requestedAt: z.string().nullable(),
				expirationAt: z.string().nullable(),
				effectivedAt: z.string().nullable(),
				evidence: z.string().nullable(),
			})
			.strict(),
		financial: z
			.object({
				award: SchemaModelMoneyNullable,
				awardComponents: z.array(
					z.preprocess(parseBrazilianNumber, z.number().finite()),
				),
				awardEvidence: z.string().nullable(),
				nonLiquidCharges: z.array(
					z.preprocess(parseBrazilianNumber, z.number().finite().nonnegative()),
				),
				finalTotal: SchemaModelMoneyNullable,
				financialEvidence: z.string().nullable(),
				installments: SchemaModelIntegerNullable,
				installmentsEvidence: z.string().nullable(),
				franchise: SchemaModelMoneyNullable,
				franchiseEvidence: z.string().nullable(),
			})
			.strict(),
	})
	.strict();

type ModelOutput = z.infer<typeof SchemaModelOutput>;

function mountPrompt(
	text: string,
	insuranceCompanies: Array<InsuranceCompanyRow>,
	imagesCount: number,
): string {
	const companies = insuranceCompanies
		.map((company, index) => `${index + 1}|${company.name}|${company.cnpj}`)
		.join('\n');

	return `
Extraia os dados de uma PROPOSTA ou APÓLICE de seguro de automóvel ou motocicleta.
Caminhão e qualquer outra modalidade estão FORA DO ESCOPO por enquanto.

${visionInstructions(imagesCount)}

PRINCÍPIO DE SEGURANÇA
- Não adivinhe.
- Quando um campo crítico estiver ambíguo, retorne null/unknown no JSON bruto para que o sistema rejeite a extração.
- Use a estrutura visual das páginas para diferenciar colunas de prêmio, franquia, LMI, parcelas e totais.

SEGURADORA ATUAL
"insuranceCompany.index" é a MARCA/SEGURADORA COMERCIAL ATUAL do produto.
Prioridade:
1. marca comercial atual explicitada no cabeçalho, produto ou segmento;
2. nome atual do produto/seguradora no corpo do documento;
3. somente se não existir marca comercial diferente, a sociedade seguradora jurídica/emissora.

NUNCA use como seguradora atual algo que esteja apenas em contexto de:
- seguradora anterior;
- congênere;
- cia anterior;
- origem do bônus;
- apólice anterior;
- renovação de outra companhia.

Uma empresa do grupo pode emitir/garantir juridicamente um produto com outra marca comercial. Se a marca comercial tiver registro próprio na lista, escolha a marca comercial.
"insuranceCompany.evidence" deve ser um trecho curto do documento que mostre a marca escolhida.
"basis" = "commercial_brand" quando houver marca comercial explícita; use "legal_issuer" somente quando o emissor jurídico também representar o produto atual e não houver outra marca comercial.

MODALIDADE
- carro, utilitário, SUV, pickup leve etc. => vehicle;
- moto/motocicleta => motorcycle;
- caminhão, cavalo mecânico ou outra modalidade => unsupported;
- não use finalidade de uso para decidir modalidade.

SEGURADO E CONDUTOR
- segurado/proponente não é automaticamente o condutor;
- use o celular do segurado, nunca telefone do corretor, banco ou terceiro;
- quando o documento disser explicitamente "Próprio Segurado" ou equivalente, copie os dados do segurado para o principal condutor;
- se existir outro principal condutor, use os dados dele;
- ano do veículo = ANO MODELO quando fabricação/modelo forem diferentes.

PLACA
- "plateStatus" = "present" somente quando houver placa válida impressa;
- "explicitly_absent" somente quando o documento mostrar claramente ausência, por exemplo "-", "A AVISAR", "SEM PLACA" ou equivalente;
- se você apenas não conseguir localizar a placa, use "unknown", não "explicitly_absent".

USO DO VEÍCULO
Mapeie para exatamente um valor:
- particular => leisure_and_work;
- explicitamente somente lazer => leisure;
- visitas a clientes/fornecedores => client_supplier_visits;
- transporte por aplicativo => app_based_transport;
- táxi => taxi;
- transporte público => public_transportation;
- entregas/carga para entrega => delivieries;
- turismo => tourism.
Se não for possível mapear com segurança, use null.

VIGÊNCIA
- requestedAt = início da vigência;
- expirationAt = fim da vigência;
- effectivedAt só deve ser preenchido se o documento for efetivamente uma APÓLICE e trouxer uma data clara de emissão/efetivação aplicável;
- um documento chamado "Proposta", mesmo que mostre status "Emitido" ou número de apólice, continua sendo proposal e effectivedAt deve ser null.

PRÊMIO / AWARD
"financial.award" = PRÊMIO/VALOR/PREÇO LÍQUIDO GLOBAL DA CONTRATAÇÃO, antes de IOF, juros, encargos, adicional de fracionamento e custos equivalentes.
"Prêmio Líquido Total" É um rótulo válido quando representa o líquido global.
NÃO use prêmio individual de cobertura e NÃO use o prêmio/valor total final com impostos.

Se o líquido global for formado por mais de um componente explícito, some os componentes. Exemplo conceitual: líquido automóvel + líquido residencial = líquido global. Coloque cada componente em "awardComponents" e o resultado em "award".
Se existir um único líquido global explícito, use "awardComponents": [award].
"awardEvidence" deve conter os menores trechos que comprovem os componentes ou o líquido global.

"nonLiquidCharges" deve conter somente valores que são adicionados ao líquido para formar o total final, como IOF, juros, adicional de fracionamento, custo de apólice e encargos. Não inclua valores zero.
"finalTotal" é o total final com impostos/encargos, apenas para validação.
"financialEvidence" deve trazer os trechos curtos usados para líquido, encargos e total.

PARCELAS
"installments" = quantidade real de parcelas.
- à vista => 1;
- "1+9" => 10;
- "1+11" => 12;
- "1+3" => 4;
- em "2412 - CR - 12 parc", 2412 é código do plano e 12 é a quantidade.
"installmentsEvidence" deve transcrever o trecho que comprova a quantidade.

FRANQUIA
"franchise" = franquia PRINCIPAL do risco/veículo, sempre existente neste domínio.
Ela pode aparecer como casco, compreensiva, básica, obrigatória, reduzida, participação obrigatória, 25% da normal, 50% da obrigatória, indenização parcial do veículo ou outro nome equivalente.
Normalmente está associada à primeira cobertura principal, mas confirme pela estrutura da tabela.
NUNCA use franquia de vidro, para-brisa, farol, lanterna, retrovisor, roda, pneu, assistência ou outro serviço acessório.
NUNCA confunda a franquia com o prêmio da cobertura na coluna ao lado.
"franchiseEvidence" deve conter o trecho da cobertura/franquia principal e seu valor.

RENOVAÇÃO
- renewal=true somente com evidência de renovação/apólice anterior/congênere;
- renewal=false quando houver "Seguro novo" ou equivalente;
- latestProposal é SOMENTE código de proposta anterior quando isso estiver explicitamente identificado; não transforme número de apólice anterior em proposta anterior. Caso não exista proposta anterior explícita, use null.

FORMATO DE SAÍDA
Responda somente JSON minificado neste formato exato:
{
  "documentKind":"proposal|policy|endorsement|unknown",
  "latestProposal":"string|null",
  "renewal":true,
  "renewalEvidence":"string|null",
  "modality":"vehicle|motorcycle|unsupported|unknown",
  "modalityEvidence":"string|null",
  "insuranceCompany":{"index":1,"basis":"commercial_brand|legal_issuer|null","evidence":"string|null"},
  "insured":{"name":"string|null","registration":"string|null","phone":"string|null","birth":"DD/MM/AAAA|null","profession":"string|null","evidence":"string|null","phoneEvidence":"string|null"},
  "vehicle":{"plate":"string|null","plateStatus":"present|explicitly_absent|unknown","plateEvidence":"string|null","model":"string|null","year":2026,"usage":"leisure_and_work|leisure|client_supplier_visits|app_based_transport|taxi|public_transportation|delivieries|tourism|null","overnightStayPostalCode":"string|null","driver":{"name":"string|null","cpf":"string|null","birth":"DD/MM/AAAA|null","evidence":"string|null"}|null},
  "vigency":{"requestedAt":"DD/MM/AAAA|null","expirationAt":"DD/MM/AAAA|null","effectivedAt":"DD/MM/AAAA|null","evidence":"string|null"},
  "financial":{"award":1234.56,"awardComponents":[1234.56],"awardEvidence":"string|null","nonLiquidCharges":[91.23],"finalTotal":1325.79,"financialEvidence":"string|null","installments":10,"installmentsEvidence":"string|null","franchise":2500,"franchiseEvidence":"string|null"}
}

LISTA DE SEGURADORAS DO BANCO
Cada linha é índice|nome|cnpj. Retorne somente o índice em insuranceCompany.index.
${companies}

TEXTO EXTRAÍDO DO PDF
"""
${text}
"""
`;
}

function validateFinancial(raw: ModelOutput['financial'], sourceText: string) {
	if (raw.award === null || raw.award <= 0) {
		throw new Error(
			'Não foi possível determinar o prêmio líquido com segurança',
		);
	}

	if (!raw.awardEvidence) {
		throw new Error('Prêmio líquido identificado sem evidência');
	}

	if (raw.awardComponents.length) {
		assertClose(
			sum(raw.awardComponents),
			raw.award,
			'Os componentes do prêmio líquido não fecham com o prêmio líquido informado',
		);

		for (const component of raw.awardComponents) {
			if (!evidenceContainsValue(raw.awardEvidence, component)) {
				throw new Error(
					'A evidência não confirma todos os componentes do prêmio líquido',
				);
			}
		}
	} else if (!evidenceContainsValue(raw.awardEvidence, raw.award)) {
		throw new Error('A evidência não confirma o prêmio líquido');
	}

	if (raw.finalTotal !== null) {
		if (!raw.financialEvidence) {
			throw new Error('Total financeiro identificado sem evidência');
		}

		if (!evidenceContainsValue(raw.financialEvidence, raw.finalTotal)) {
			throw new Error('A evidência não confirma o valor total da contratação');
		}

		for (const charge of raw.nonLiquidCharges) {
			if (!evidenceContainsValue(raw.financialEvidence, charge)) {
				throw new Error(
					'A evidência não confirma todos os encargos financeiros',
				);
			}
		}

		assertClose(
			raw.award + sum(raw.nonLiquidCharges),
			raw.finalTotal,
			'Prêmio líquido, encargos e total final são matematicamente inconsistentes',
		);
	}

	if (raw.installments === null || raw.installments < 1) {
		throw new Error('Não foi possível determinar a quantidade de parcelas');
	}

	if (
		!evidenceSupportsInstallments(raw.installmentsEvidence, raw.installments)
	) {
		throw new Error('A evidência não confirma a quantidade de parcelas');
	}

	if (raw.franchise === null || raw.franchise <= 0) {
		throw new Error('Não foi possível determinar a franquia principal');
	}

	if (!raw.franchiseEvidence) {
		throw new Error('Franquia principal identificada sem evidência');
	}

	if (!evidenceContainsValue(raw.franchiseEvidence, raw.franchise)) {
		throw new Error('A evidência não confirma a franquia principal');
	}

	if (
		!franchiseEvidenceLooksPrincipal(raw.franchiseEvidence) &&
		!sourceSupportsPrincipalFranchise(sourceText, raw.franchise)
	) {
		throw new Error(
			'A evidência da franquia não permite confirmar que seja a franquia principal',
		);
	}

	return {
		award: raw.award,
		installments: raw.installments,
		franchise: raw.franchise,
	};
}

function finalizeModelOutput(
	raw: ModelOutput,
	insuranceCompanies: Array<InsuranceCompanyRow>,
	sourceText: string,
): DataExtract {
	if (raw.documentKind === 'endorsement') {
		throw new Error(
			'O documento enviado é um endosso, não uma proposta/apólice',
		);
	}

	if (raw.documentKind === 'unknown') {
		throw new Error(
			'Não foi possível identificar o tipo do documento com segurança',
		);
	}

	if (raw.modality !== 'vehicle' && raw.modality !== 'motorcycle') {
		throw new Error(
			'Modalidade não suportada ou não identificada com segurança',
		);
	}

	if (!raw.modalityEvidence) {
		throw new Error('Modalidade identificada sem evidência');
	}

	if (raw.renewal === null || !raw.renewalEvidence) {
		throw new Error(
			'Não foi possível determinar se o seguro é novo ou renovação',
		);
	}

	const companyIndex = raw.insuranceCompany.index;

	if (!companyIndex || !raw.insuranceCompany.evidence) {
		throw new Error(
			'Não foi possível determinar a seguradora atual com segurança',
		);
	}

	const company = insuranceCompanies[companyIndex - 1];

	if (!company) {
		throw new Error('Seguradora não encontrada na lista do banco de dados');
	}

	if (!companyEvidenceMatches(company.name, raw.insuranceCompany.evidence)) {
		throw new Error(
			'A evidência da seguradora não confirma a marca/seguradora selecionada',
		);
	}

	const insured = raw.insured;

	if (
		!insured.name ||
		!insured.registration ||
		!insured.phone ||
		!insured.evidence ||
		!insured.phoneEvidence
	) {
		throw new Error(
			'Dados do segurado incompletos ou sem evidência suficiente',
		);
	}

	const insuredRegistrationConfirmed =
		evidenceContainsRegistration(insured.evidence, insured.registration) ||
		sourceContainsRegistrationNear(sourceText, insured.registration, [
			'dados do segurado',
			'dados do proponente',
			'proponente segurado',
			'nome do segurado',
			'nome do proponente',
		]);

	if (!insuredRegistrationConfirmed) {
		throw new Error('O documento não confirma o CPF/CNPJ do segurado');
	}

	const normalizedPhone = normalizeBrazilianPhone(insured.phone);

	const insuredPhoneConfirmed =
		digitsOnly(insured.phoneEvidence).includes(normalizedPhone) ||
		sourceContainsPhoneNear(sourceText, insured.phone, [
			'celular',
			'tel celular',
			'telefone celular',
		]);

	if (!insuredPhoneConfirmed) {
		throw new Error('O documento não confirma o celular do segurado');
	}

	const vehicle = raw.vehicle;

	if (
		!vehicle.model ||
		vehicle.year === null ||
		!vehicle.usage ||
		!vehicle.overnightStayPostalCode ||
		!vehicle.driver
	) {
		throw new Error('Dados do veículo/condutor incompletos ou ambíguos');
	}

	let plate: string | null;

	if (vehicle.plateStatus === 'present') {
		plate = SchemaPlateLenient.parse(vehicle.plate);

		if (!plate || !vehicle.plateEvidence) {
			throw new Error('Placa informada não pôde ser validada');
		}

		const compactEvidence = vehicle.plateEvidence
			.replace(/[^a-zA-Z0-9]/g, '')
			.toLowerCase();

		if (!compactEvidence.includes(plate)) {
			throw new Error('A evidência não confirma a placa do veículo');
		}
	} else if (vehicle.plateStatus === 'explicitly_absent') {
		if (!vehicle.plateEvidence) {
			throw new Error('Ausência de placa informada sem evidência');
		}

		plate = null;
	} else {
		throw new Error('Não foi possível determinar a placa com segurança');
	}

	const driver = vehicle.driver;

	if (!driver.name || !driver.cpf || !driver.evidence) {
		throw new Error('Principal condutor não identificado com segurança');
	}

	const driverRegistrationConfirmed =
		evidenceContainsRegistration(driver.evidence, driver.cpf) ||
		sourceContainsRegistrationNear(sourceText, driver.cpf, [
			'principal condutor',
			'condutor principal',
			'nome do principal condutor',
			'dados do perfil',
			'questionario de avaliacao de risco',
		]);

	if (!driverRegistrationConfirmed) {
		throw new Error('O documento não confirma o CPF do principal condutor');
	}

	const vigency = raw.vigency;

	if (!vigency.requestedAt || !vigency.expirationAt || !vigency.evidence) {
		throw new Error('Vigência não identificada com segurança');
	}

	if (
		!evidenceContainsDate(vigency.evidence, vigency.requestedAt) ||
		!evidenceContainsDate(vigency.evidence, vigency.expirationAt)
	) {
		throw new Error('A evidência não confirma as datas de vigência');
	}

	if (raw.documentKind === 'proposal' && vigency.effectivedAt !== null) {
		throw new Error('Proposta não deve possuir data de efetivação de apólice');
	}

	if (raw.documentKind === 'policy' && !vigency.effectivedAt) {
		throw new Error('Apólice identificada sem data de efetivação segura');
	}

	const financial = validateFinancial(raw.financial, sourceText);

	return SchemaDataExtract.parse({
		latestProposal: raw.latestProposal,
		renewal: raw.renewal,
		modality: raw.modality,
		insuranceCompany: company,
		insured: {
			name: insured.name,
			registration: insured.registration,
			phone: insured.phone,
			birth: insured.birth,
			profession: insured.profession,
		},
		vehicle: {
			plate,
			model: vehicle.model,
			year: vehicle.year,
			usage: vehicle.usage,
			overnightStayPostalCode: vehicle.overnightStayPostalCode,
			driver: {
				name: driver.name,
				cpf: driver.cpf,
				birth: driver.birth,
			},
		},
		effectivedAt: vigency.effectivedAt,
		requestedAt: vigency.requestedAt,
		expirationAt: vigency.expirationAt,
		...financial,
	});
}

async function askModel(
	{
		model,
		text,
		images,
	}: { model: string; text: string; images: Array<string> },
	insuranceCompanies: Array<InsuranceCompanyRow>,
): Promise<DataExtract> {
	const parsed = await askJson({
		model,
		prompt: mountPrompt(text, insuranceCompanies, images.length),
		images,
	});

	const raw = SchemaModelOutput.parse(parsed);

	return finalizeModelOutput(raw, insuranceCompanies, text);
}

async function completeBirths(valid: DataExtract): Promise<DataExtract> {
	const lookupCPF = async (registration: string) => {
		try {
			const document = await documentByCPF(registration);

			return format(document.birth, 'dd/MM/yyyy');
		} catch (error) {
			console.warn(
				'[extract-pdf] consulta de nascimento falhou:',
				error instanceof Error ? error.message : error,
			);

			return null;
		}
	};

	const insuredIsPerson = isCPF(valid.insured.registration);
	const driverIsInsured =
		insuredIsPerson && valid.insured.registration === valid.vehicle.driver.cpf;

	const [insuredBirth, driverBirth] = await Promise.all([
		valid.insured.birth
			? Promise.resolve(valid.insured.birth)
			: insuredIsPerson
				? lookupCPF(valid.insured.registration)
				: Promise.resolve(null),
		valid.vehicle.driver.birth
			? Promise.resolve(valid.vehicle.driver.birth)
			: driverIsInsured && valid.insured.birth
				? Promise.resolve(valid.insured.birth)
				: lookupCPF(valid.vehicle.driver.cpf),
	]);

	valid.insured.birth = insuredBirth ?? null;
	valid.vehicle.driver.birth = driverIsInsured
		? (valid.insured.birth ?? driverBirth ?? null)
		: (driverBirth ?? null);

	if (insuredIsPerson && !valid.insured.birth) {
		throw new Error('Data de nascimento do segurado não pôde ser confirmada');
	}

	if (!valid.vehicle.driver.birth) {
		throw new Error(
			'Data de nascimento do principal condutor não pôde ser confirmada',
		);
	}

	return SchemaDataExtract.parse(valid);
}

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
		`[extract-pdf] consultas de nascimento ${Math.round(performance.now() - lookupStarted)}ms`,
	);

	return data;
}

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
				const cacheKey = `pdf-extract:v12:${hash}`;
				const cached = await ctx.cache.get(cacheKey);

				if (cached) {
					return ctx.json(JSON.parse(cached), 200);
				}

				const data = await extractData(
					buffer,
					await ctx.database.insuranceCompany.findMany({
						select: {
							id: true,
							name: true,
							cnpj: true,
						},
						orderBy: { name: 'asc' },
					}),
				);

				await ctx.cache.set(cacheKey, JSON.stringify(data), 'EX', 60 * 60 * 24);

				return ctx.json(data, 200);
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: 'Falha ao extrair dados do documento';

				if (error instanceof AIProviderError) {
					return ctx.json({ message }, 503);
				}

				return ctx.json({ message }, 409);
			}
		},
	);
}

export { registerRoutersServicesSafesExtractPDF };
