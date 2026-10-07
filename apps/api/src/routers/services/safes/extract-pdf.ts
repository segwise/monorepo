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

/**
 * Normalização específica de quantidade de parcelas.
 *
 * Evitamos usar uma função genérica de inteiro porque textos como:
 *
 * "2412 - CR - 12 parc"
 *
 * não podem retornar 2412.
 */
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

	/**
	 * 10x
	 * 10 x
	 */
	const timesMatch = normalized.match(/\b(\d{1,2})\s*x\b/);

	if (timesMatch?.[1]) {
		const parsed = Number(timesMatch[1]);

		return Number.isFinite(parsed) ? parsed : value;
	}

	/**
	 * 12 parcelas
	 * 12 parcela
	 * 12 parc
	 */
	const installmentMatch = normalized.match(
		/\b(\d{1,2})\s*(?:parcelas?|parc\.?)\b/,
	);

	if (installmentMatch?.[1]) {
		const parsed = Number(installmentMatch[1]);

		return Number.isFinite(parsed) ? parsed : value;
	}

	/**
	 * Se a IA já retornou apenas:
	 *
	 * "12"
	 *
	 * podemos aceitar com segurança.
	 */
	if (/^\d{1,2}$/.test(normalized)) {
		const parsed = Number(normalized);

		return Number.isFinite(parsed) ? parsed : value;
	}

	return value;
}

/**
 * Normalização específica do ano do modelo.
 *
 * Se excepcionalmente a IA devolver:
 *
 * "2025 / 2026"
 *
 * usamos o último ano como fallback, pois normalmente a disposição é:
 *
 * fabricação / modelo.
 *
 * O prompt ainda orienta a IA a devolver somente o ano do modelo.
 */
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

	/**
	 * Também impede que um chassi seja aceito como placa quando
	 * o parser do PDF perder o layout da tabela.
	 */
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

		/**
		 * O SchemaModality utilizado pelo sistema também possui produtos
		 * que não são veiculares.
		 */
		vehicle: SchemaVehicle.nullish(),

		effectivedAt: SchemaDateString.nullish(),

		requestedAt: SchemaDateString,

		expirationAt: SchemaDateString,

		/**
		 * Prêmio líquido TOTAL da proposta/apólice.
		 *
		 * Não inclui IOF, juros e encargos.
		 */
		award: z
			.number('Valor da proposta inválido')
			.nonnegative('Valor da proposta inválido'),

		installments: z
			.number('Número de parcelas inválido')
			.int('Número de parcelas inválido')
			.positive('Número de parcelas inválido')
			.max(60, 'Número de parcelas inválido'),

		/**
		 * Nem todo produto/modalidade necessariamente possui franquia.
		 */
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
 * Schema bruto retornado pela IA
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

		/**
		 * Índice da seguradora na lista enviada ao modelo.
		 */
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
		 * Prêmio líquido total.
		 */
		award: SchemaModelMoneyNullable,

		awardEvidence: z.string().nullable(),

		/**
		 * Campos auxiliares para validação financeira.
		 *
		 * Não são devolvidos na resposta final da API.
		 */
		totalPremium: SchemaModelMoneyNullable,

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
 * Prompt
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

IMPORTANTE SOBRE O PDF

O texto foi extraído automaticamente de um PDF.

A extração textual pode:
- inverter colunas;
- perder alinhamento;
- misturar cabeçalhos;
- colocar chassi abaixo do label "Placa";
- colocar prêmio ao lado da franquia;
- misturar franquia principal com franquias de vidros;
- misturar prêmio líquido com prêmio total;
- separar os títulos das tabelas dos respectivos valores.

Quando imagens das páginas forem fornecidas, utilize também a estrutura
VISUAL da página.

Quando a estrutura visual e o texto linearizado parecerem contraditórios,
prefira a estrutura visual da página.

Analise TODO o documento antes de responder.

Nunca invente informações.

FORMATO EXATO DA RESPOSTA

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
	"iof": "number ou null",
	"interest": "number ou null",
	"fees": "number ou null",
	"installments": "number ou null",
	"installmentsEvidence": "string ou null",
	"franchise": "number ou null",
	"franchiseEvidence": "string ou null"
}

SEGURADORA

"insuranceCompany" deve ser o índice "i" da seguradora que efetivamente
EMITE ou GARANTE o seguro.

Não confunda seguradora com:
- corretora;
- banco;
- parceiro comercial;
- estipulante;
- titular do cartão;
- empresa que apenas distribui o produto.

Utilize como evidência forte:
- CNPJ da seguradora;
- código SUSEP;
- "seguro garantido por";
- "dados da seguradora";
- razão social da seguradora;
- informações jurídicas do produto.

Um produto pode possuir uma marca bancária ou comercial no cabeçalho e ainda
ser juridicamente emitido por outra seguradora.

Não escolha a seguradora apenas pelo maior logotipo.

LISTA DE SEGURADORAS DO MEU BANCO:

${JSON.stringify(insuranceCompanies)}

RENOVAÇÃO

"renewal" deve ser true quando o documento indicar:
- renovação;
- renovação congênere;
- renovação da própria companhia;
- existência de apólice anterior;
- código CI anterior;
- seguradora anterior.

"renewal" deve ser false quando indicar:
- seguro novo;
- contratação nova sem apólice anterior.

LATEST PROPOSAL

"latestProposal" representa a identificação da APÓLICE ou PROPOSTA ANTERIOR
utilizada na renovação.

NUNCA use:
- número da proposta atual;
- número do orçamento atual;
- número da cotação atual;
- número da apólice atual.

Se não existir identificação anterior clara:
null.

MODALIDADE

"modality" representa o tipo do bem/risco segurado.

- automóvel/carro/utilitário => vehicle
- motocicleta/moto => motorcycle
- caminhão => truck
- saúde => health
- residência => residence
- empresa => business
- condomínio => condominium
- viagem => travel
- responsabilidade profissional => professional
- obra/construção => construction

A finalidade de uso NÃO altera modality.

Exemplos:

carro de aplicativo => modality "vehicle"
táxi => modality "vehicle"
moto => modality "motorcycle"

VEÍCULO

Se modality for:
- vehicle
- motorcycle
- truck

"vehicle" deve ser preenchido.

Nas demais modalidades:
"vehicle": null.

PLACA

Tenha extremo cuidado.

Placa brasileira normalmente possui 7 caracteres alfanuméricos.

Chassi normalmente possui 17 caracteres.

NUNCA interprete chassi como placa.

Exemplo:

Placa: -
Chassi: LC0CE4CB4T0012228

Resultado:

"plate": null

Veículos zero km podem aparecer como:
- "-"
- "A AVISAR"
- "SEM PLACA"
- "S/ PLACA"

Todos significam:
null.

ANO DO VEÍCULO

"vehicle.year" deve ser o ANO DO MODELO.

Exemplo:

Ano Fabricação / Modelo:
2025 / 2026

Resultado:

"year": 2026

USO DO VEÍCULO

Mapeamento:

- "Particular" sem especificação adicional => leisure_and_work
- "Particular - Lazer / ida e volta ao trabalho" => leisure_and_work
- somente "Lazer" => leisure
- visitas a clientes/fornecedores => client_supplier_visits
- Uber/99/aplicativo/transporte por aplicativo => app_based_transport
- táxi => taxi
- transporte público => public_transportation
- entregas => delivieries
- turismo => tourism

CONDUTOR

O campo driver representa o PRINCIPAL CONDUTOR.

Não confunda principal condutor com:
- segurado;
- proprietário;
- titular do cartão;
- corretor.

Se o documento disser explicitamente:
- "Próprio Segurado";
- "O próprio segurado";
- ou equivalente;

preencha driver utilizando os dados do segurado.

PRÊMIO LÍQUIDO / award

REGRA CRÍTICA:

"award" representa o PRÊMIO LÍQUIDO TOTAL DA PROPOSTA OU APÓLICE.

É o prêmio líquido do contrato COMPLETO antes de:
- IOF;
- juros;
- encargos.

Rótulos possíveis:
- Prêmio Líquido
- Prêmio Líquido Total
- Valor Líquido
- Total Líquido
- Prêmio Líquido do Seguro

IMPORTANTE:

"Prêmio Líquido Total" É um valor válido para award.

Nesse contexto a palavra "Total" significa a totalização dos PRÊMIOS LÍQUIDOS
das coberturas.

Ela NÃO significa necessariamente o prêmio total com impostos.

EXEMPLO 1

Prêmio Líquido Total: R$ 4.247,70
Juros: R$ 0,00
IOF: R$ 313,47
Prêmio Total: R$ 4.561,17

Resultado:

"award": 4247.70
"totalPremium": 4561.17
"iof": 313.47
"interest": 0

EXEMPLO 2

Valor líquido: R$ 3.704,23
IOF: R$ 273,37
Juros: R$ 0,00
Encargos: R$ 0,00
Valor total: R$ 3.977,60

Resultado:

"award": 3704.23
"totalPremium": 3977.60
"iof": 273.37
"interest": 0
"fees": 0

NÃO use como award:
- prêmio total;
- valor total com impostos;
- IOF;
- juros;
- encargos;
- valor da parcela;
- valor da primeira parcela;
- prêmio individual de uma cobertura;
- prêmio do casco isoladamente;
- prêmio RCF isoladamente;
- franquia;
- limite máximo de indenização;
- FIPE.

Se houver vários valores de "Valor do Prêmio" para coberturas individuais e
depois existir "Prêmio Líquido Total", utilize o PRÊMIO LÍQUIDO TOTAL.

AWARD EVIDENCE

"awardEvidence" deve ser o MENOR trecho suficiente para comprovar o
prêmio líquido escolhido.

Exemplo:

"Prêmio Líquido Total R$ 4.247,70"

Não explique o raciocínio.

TOTAL PREMIUM / IOF / JUROS / ENCARGOS

Esses campos são auxiliares para validar a interpretação financeira.

"totalPremium":
valor total final incluindo impostos e encargos.

"iof":
IOF total.

"interest":
juros totais.

"fees":
encargos adicionais.

Se o documento mostrar explicitamente:
R$ 0,00

retorne:
0

Se não for possível determinar:
null.

PARCELAS

"installments" representa SOMENTE a QUANTIDADE DE PARCELAS.

Exemplos:

à vista => 1
1 parcela => 1
10x => 10
10 parcelas => 10
12 parc => 12

NUNCA retorne:
- valor da parcela;
- código do plano;
- número da agência;
- número do cartão.

"installmentsEvidence" deve conter o menor trecho suficiente para confirmar
a quantidade de parcelas.

Exemplo:

"10x R$ 397,76"

Resultado:

"installments": 10
"installmentsEvidence": "10x R$ 397,76"

FRANQUIA

"franchise" representa SOMENTE a FRANQUIA PRINCIPAL DO CASCO.

Pode aparecer como:
- franquia básica;
- franquia obrigatória;
- participação obrigatória;
- 25% da básica;
- 50% da obrigatória;
- franquia compreensiva.

EXEMPLO

Descrição | LMI | Franquia | Valor do Prêmio

Compreensiva | 100% | R$ 19.172,00 | R$ 2.535,28

Resultado:

"franchise": 19172

NÃO retorne:
2535.28

Esse valor é o prêmio da cobertura.

Outro exemplo:

Prêmio Líquido total R$ 4.247,70
R$ 3.788,00 (50% da Básica)

Resultado:

"franchise": 3788

NÃO some franquias.

NÃO use:
- para-brisa;
- vidro lateral;
- vidro traseiro;
- vigia;
- farol;
- lanterna;
- retrovisor;
- roda;
- pneu;
- serviços específicos.

"franchiseEvidence" deve conter o menor trecho suficiente para comprovar
a franquia principal.

CEP DE PERNOITE

Use o CEP específico de pernoite/local de risco do veículo.

O CEP residencial do segurado pode ser usado para corrigir um CEP de pernoite
cortado SOMENTE quando estiver claro que representam o mesmo CEP.

Exemplo:

CEP residencial: 50030-230
CEP pernoite extraído: 50030

Se estiver claro que o CEP de pernoite foi apenas truncado:
use 50030-230.

Não invente CEP quando houver mais de uma possibilidade.

DATAS

"requestedAt":
data de início da vigência.

"expirationAt":
data final da vigência.

"effectivedAt":
data de efetivação/emissão quando o documento representar efetivamente
uma APÓLICE emitida.

Se for somente uma proposta:
null.

A data de impressão NÃO é automaticamente effectivedAt.

REGRAS GERAIS

- Responda APENAS JSON válido.
- JSON minificado em uma única linha.
- Não use markdown.
- Não use \`\`\`.
- Não escreva comentários.
- Não adicione campos.
- Todo number deve ser JSON number.
- R$ 1.234,56 => 1234.56
- Não invente dados.
- Nenhum campo deve conter dois valores.
- Analise TODO o documento antes de responder.
- Utilize imagens para confirmar tabelas quando disponíveis.

Texto extraído do documento:

"""
${text}
"""
`;
}

function mountRetryPrompt(
	basePrompt: string,
	previous: unknown,
	reason: string,
): string {
	return `
${basePrompt}

ATENÇÃO: A EXTRAÇÃO ANTERIOR FOI CONSIDERADA INCONSISTENTE.

Motivo:

${reason}

Resposta anterior:

${JSON.stringify(previous)}

Revise TODO o documento novamente.

Dê atenção especial a:
- prêmio líquido TOTAL;
- prêmio total com IOF;
- franquia principal;
- valor do prêmio da cobertura versus franquia;
- quantidade de parcelas;
- código do plano versus quantidade de parcelas;
- placa versus chassi;
- ano fabricação versus ano modelo;
- seguradora jurídica correta;
- proposta atual versus apólice/proposta anterior.

Retorne novamente SOMENTE o JSON completo corrigido.
`;
}

/**
 * ============================================================================
 * Validações semânticas
 * ============================================================================
 */

function isVehicleModality(modality: DataExtract['modality']): boolean {
	return (
		modality === 'vehicle' || modality === 'motorcycle' || modality === 'truck'
	);
}

function validateFinancialExtraction(raw: ModelOutput): void {
	if (raw.award === null) {
		throw new Error(
			'Não foi possível determinar o prêmio líquido total da proposta',
		);
	}

	if (!raw.awardEvidence) {
		throw new Error('Prêmio líquido identificado sem evidência no documento');
	}

	if (!evidenceContainsValue(raw.awardEvidence, raw.award)) {
		throw new Error(
			'A evidência apresentada não confirma o prêmio líquido identificado',
		);
	}

	if (raw.installments === null) {
		throw new Error('Não foi possível determinar a quantidade de parcelas');
	}

	if (!raw.installmentsEvidence) {
		throw new Error(
			'Quantidade de parcelas identificada sem evidência no documento',
		);
	}

	if (
		!evidenceContainsValue(raw.installmentsEvidence, raw.installments, 0.001)
	) {
		throw new Error(
			'A evidência apresentada não confirma a quantidade de parcelas',
		);
	}

	if (raw.franchise !== null) {
		if (!raw.franchiseEvidence) {
			throw new Error('Franquia identificada sem evidência no documento');
		}

		if (!evidenceContainsValue(raw.franchiseEvidence, raw.franchise)) {
			throw new Error(
				'A evidência apresentada não confirma o valor da franquia',
			);
		}
	}

	/**
	 * O prêmio total não deveria ser inferior ao prêmio líquido.
	 */
	if (raw.totalPremium !== null && raw.totalPremium + 0.05 < raw.award) {
		throw new Error(
			`Prêmio total ${raw.totalPremium} é inferior ao prêmio líquido ${raw.award}`,
		);
	}

	/**
	 * Quando temos todos os componentes, conseguimos verificar a conta:
	 *
	 * total =
	 * líquido + IOF + juros + encargos
	 */
	if (
		raw.totalPremium !== null &&
		raw.iof !== null &&
		raw.interest !== null &&
		raw.fees !== null
	) {
		const expected = raw.award + raw.iof + raw.interest + raw.fees;

		if (!moneyAlmostEqual(expected, raw.totalPremium)) {
			throw new Error(
				`Valores financeiros inconsistentes: prêmio líquido ${raw.award}, IOF ${raw.iof}, juros ${raw.interest}, encargos ${raw.fees}, prêmio total ${raw.totalPremium}`,
			);
		}
	}

	/**
	 * Detecta o erro clássico:
	 *
	 * usar o Prêmio Total como award mesmo existindo IOF.
	 */
	if (
		raw.totalPremium !== null &&
		raw.iof !== null &&
		raw.iof > 0 &&
		moneyAlmostEqual(raw.award, raw.totalPremium)
	) {
		throw new Error(
			'O prêmio líquido foi confundido com o prêmio total incluindo IOF',
		);
	}
}

/**
 * ============================================================================
 * Conversão do resultado da IA para o Schema final
 * ============================================================================
 */

function finalizeModelOutput(
	raw: ModelOutput,
	insuranceCompanies: Array<InsuranceCompanyRow>,
): DataExtract {
	validateFinancialExtraction(raw);

	if (raw.award === null) {
		throw new Error('Prêmio líquido obrigatório não identificado');
	}

	if (raw.installments === null) {
		throw new Error('Quantidade de parcelas obrigatória não identificada');
	}

	const company = insuranceCompanies[raw.insuranceCompany - 1];

	if (!company) {
		throw new z.ZodError([
			{
				code: 'custom',

				path: ['insuranceCompany'],

				message: 'Seguradora não encontrada na lista',

				input: raw.insuranceCompany,
			},
		]);
	}

	const vehicleModality = isVehicleModality(raw.modality);

	if (vehicleModality && !raw.vehicle) {
		throw new Error('Seguro veicular identificado sem dados do veículo');
	}

	if (!vehicleModality && raw.vehicle) {
		throw new Error('Documento não veicular retornou dados de veículo');
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

	/**
	 * Se houver referência clara à apólice/proposta anterior,
	 * forçamos renewal = true mesmo que a IA tenha retornado false.
	 */
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

	try {
		previous = await askJson({
			model,
			prompt,
			images,
		});

		const parsed = SchemaModelOutput.parse(previous);

		return finalizeModelOutput(parsed, insuranceCompanies);
	} catch (firstError) {
		const reason = errorMessage(firstError);

		console.warn('[extract-pdf] primeira extração inconsistente:', reason);

		/**
		 * Retry direcionado apenas para documentos cuja primeira
		 * interpretação não passou nas validações.
		 */
		const retried = await askJson({
			model,

			prompt: mountRetryPrompt(prompt, previous, reason),

			images,
		});

		const parsed = SchemaModelOutput.parse(retried);

		return finalizeModelOutput(parsed, insuranceCompanies);
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

				/**
				 * Nova versão por causa das mudanças em:
				 *
				 * - prêmio líquido total;
				 * - prêmio total;
				 * - evidências;
				 * - parcelas;
				 * - placa versus chassi;
				 * - ano fabricação/modelo;
				 * - seguradora + CNPJ;
				 * - veículo nullable;
				 * - franquia nullable.
				 */
				const cacheKey = `pdf-extract:v5:${hash}`;

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
