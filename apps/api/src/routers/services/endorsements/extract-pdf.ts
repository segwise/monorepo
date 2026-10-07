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
	 * Uma placa brasileira possui normalmente 7 caracteres.
	 *
	 * Isso também evita interpretar um chassi de 17 caracteres
	 * como placa quando o parser do PDF perde a estrutura da tabela.
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
				 * Valor LÍQUIDO da negociação do endosso.
				 *
				 * Não inclui:
				 * - IOF;
				 * - juros;
				 * - encargos financeiros.
				 *
				 * Convenção:
				 *
				 * positivo = cobrança
				 * negativo = restituição/crédito
				 * zero = sem movimentação financeira
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
 * Schemas brutos retornados pela IA
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

const SchemaModelPercentageNullable = SchemaModelPercentage.nullable();

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
		 * Valor líquido do PRODUTO/NEGOCIAÇÃO.
		 *
		 * Esse é o valor que será retornado como amount.
		 */
		amount: SchemaModelMoneyNullable,

		amountDirection: z.enum(['charge', 'refund', 'neutral']).nullable(),

		amountLabel: z.string().nullable(),

		amountEvidence: z.string().nullable(),

		/**
		 * Campos abaixo são SOMENTE de validação.
		 *
		 * Eles não são devolvidos para a API.
		 */
		totalAmount: SchemaModelMoneyNullable,

		totalAmountEvidence: z.string().nullable(),

		iof: SchemaModelMoneyNullable,

		interest: SchemaModelMoneyNullable,

		fees: SchemaModelMoneyNullable,

		percentage: SchemaModelPercentageNullable,

		percentageEvidence: z.string().nullable(),
	})
	.strict();

const SchemaModelVehicleConductor = z
	.object({
		type: z.literal('vehicle_conductor'),

		typeEvidence: z.string().nullable(),

		lookup: SchemaModelLookup,

		data: z
			.object({
				driver: z.string().nullable(),

				plate: z.string().nullable(),

				model: z.string().nullable(),

				modelYear: z.union([z.string(), z.number()]).nullable(),

				franchise: SchemaModelMoneyNullable,

				franchiseEvidence: z.string().nullable(),
			})
			.merge(SchemaModelFinancial)
			.strict(),
	})
	.strict();

const SchemaModelAddress = z
	.object({
		type: z.literal('address'),

		typeEvidence: z.string().nullable(),

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

		typeEvidence: z.string().nullable(),

		lookup: SchemaModelLookup,

		data: z
			.object({
				franchise: SchemaModelMoneyNullable,

				franchiseEvidence: z.string().nullable(),
			})
			.merge(SchemaModelFinancial)
			.strict(),
	})
	.strict();

const SchemaModelCancellation = z
	.object({
		type: z.literal('cancellation'),

		typeEvidence: z.string().nullable(),

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

		typeEvidence: z.string().nullable(),

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
 * Schema da verificação especializada da franquia
 * ============================================================================
 */

const SchemaFranchiseVerification = z
	.object({
		franchise: SchemaModelMoneyNullable,

		previousFranchise: SchemaModelMoneyNullable,

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

function mountPrompt(text: string, imagesCount: number): string {
	return `
Extraia os dados do ENDOSSO DE SEGURO presente no documento abaixo.

O documento pode ser de QUALQUER seguradora.
O layout, nomes dos campos, títulos, tabelas e organização das páginas podem variar.

${visionInstructions(imagesCount)}

IMPORTANTE SOBRE O PDF

O texto foi extraído automaticamente de um PDF e pode perder a estrutura visual.

A extração textual pode:
- inverter colunas;
- colocar valores abaixo do label errado;
- perder alinhamento;
- misturar tabelas;
- colocar chassi abaixo do campo "Placa";
- misturar franquia com prêmio;
- misturar parcelas da apólice original com dados do endosso;
- separar cabeçalhos dos respectivos valores.

Quando imagens das páginas forem fornecidas, utilize também a estrutura VISUAL
da página.

Quando o texto linearizado e a disposição visual parecerem contraditórios,
prefira a estrutura VISUAL.

Analise TODO o documento antes de responder.

Nunca invente dados.

TIPO DO ENDOSSO

Identifique exatamente um destes tipos:

1. "vehicle_conductor"

Use quando a FINALIDADE PRINCIPAL for:
- substituição de veículo;
- alteração de veículo;
- troca de placa;
- troca de modelo;
- alteração do principal condutor;
- inclusão/substituição de condutor.

2. "address"

Use quando a FINALIDADE PRINCIPAL for:
- alteração de CEP de pernoite;
- alteração do local de risco;
- alteração de endereço relacionado ao risco segurado.

3. "franchise"

Use SOMENTE quando a FINALIDADE PRINCIPAL for alterar a franquia.

A simples presença de franquia no documento NÃO significa que o endosso
seja do tipo "franchise".

Uma substituição de veículo normalmente também mostra a franquia resultante
e continua sendo "vehicle_conductor".

4. "cancellation"

Use quando a FINALIDADE PRINCIPAL for:
- cancelamento;
- rescisão;
- encerramento da apólice;
- encerramento do seguro.

5. "unknown"

Use quando:
- não for possível identificar o tipo com segurança;
- for outro tipo de endosso;
- alteração apenas de cobertura;
- alteração apenas de importância segurada;
- alteração apenas de forma de pagamento;
- qualquer alteração fora dos quatro tipos suportados.

NUNCA escolha um tipo incorreto somente para evitar "unknown".

"typeEvidence" deve conter um trecho curto do documento que confirme
a finalidade identificada.

LOOKUP

Formato:

{
	"plate": "string ou null",
	"insuredRegistration": "string ou null",
	"insuredName": "string ou null"
}

"insuredRegistration":
CPF/CNPJ do SEGURADO.

Nunca use CPF/CNPJ:
- do corretor;
- do titular do cartão;
- do condutor quando ele não for o segurado;
- de terceiro.

"insuredName":
nome/razão social do SEGURADO.

PLACA E CHASSI

- placa brasileira normalmente possui 7 caracteres;
- chassi normalmente possui 17 caracteres;
- NUNCA interprete chassi como placa.

"-", "A AVISAR", "SEM PLACA", "S/ PLACA" e equivalentes => null.

ENDOSSO DE SUBSTITUIÇÃO

Se houver claramente placa anterior e placa nova:

lookup.plate = placa anterior
data.plate = placa nova

Se existir apenas uma placa e não for possível determinar que ela seja
a anterior, use essa placa no lookup e também como placa resultante quando
ela representar o veículo após o endosso.

VALOR DO ENDOSSO / amount

REGRA CRÍTICA:

"amount" representa o VALOR LÍQUIDO DA NEGOCIAÇÃO DO ENDOSSO.

É o valor real do produto/seguro negociado pela corretora.

NÃO inclui valores decorrentes da forma de pagamento, como:
- IOF;
- juros;
- encargos financeiros;
- acréscimos de parcelamento.

O valor que deve ser usado em "amount" normalmente aparece como:

- Preço Líquido
- Prêmio Líquido
- Prêmio Líquido Total
- Valor Líquido
- Prêmio Líquido do Endosso
- Valor Líquido do Endosso
- Diferença Líquida de Prêmio

Esses nomes são exemplos.
A seguradora pode utilizar outra nomenclatura semanticamente equivalente.

IMPORTANTE:

"Prêmio Líquido Total" É um valor líquido válido.

A palavra "Total" nesse rótulo pode significar a soma dos prêmios líquidos
das coberturas e NÃO o valor com IOF.

EXEMPLO ALLIANZ

Preço Líquido: R$ 36,57
IOF: R$ 2,70
Preço Total: R$ 39,27

Resultado CORRETO:

"amount": 36.57
"totalAmount": 39.27
"iof": 2.70

Resultado ERRADO:

"amount": 39.27

R$ 39,27 é o valor financeiro final do PAGAMENTO, não o valor líquido
da negociação do seguro.

EXEMPLO TOKIO

Prêmio Líquido Total: R$ 374,29
Juros: R$ 0,00
IOF: R$ 27,62
Prêmio Total: R$ 401,91

Resultado CORRETO:

"amount": 374.29
"totalAmount": 401.91
"iof": 27.62
"interest": 0

Resultado ERRADO:

"amount": 401.91

PRIORIDADE PARA amount

Prefira, nesta ordem semântica:

1. prêmio/preço/valor LÍQUIDO explicitamente associado ao endosso;
2. diferença líquida de prêmio;
3. outro valor que represente inequivocamente o prêmio líquido do produto.

NUNCA use como amount:
- Preço Total quando existir Preço Líquido;
- Prêmio Total quando existir Prêmio Líquido;
- valor total com impostos;
- IOF;
- juros;
- encargos financeiros;
- valor de parcela;
- franquia;
- LMI;
- FIPE;
- valor individual de uma cobertura quando existir total líquido do endosso;
- comissão;
- percentual.

CAMPOS AUXILIARES DE PAGAMENTO

"totalAmount":
valor financeiro final que será pago/recebido após IOF, juros e encargos.

"iof":
IOF referente ao endosso.

"interest":
juros referentes à forma de pagamento.

"fees":
outros encargos financeiros referentes à forma de pagamento.

Esses campos servem SOMENTE para o sistema validar a extração.

Eles NÃO substituem amount.

Exemplo:

amount = 36.57
iof = 2.70
interest = 0
fees = 0
totalAmount = 39.27

Se algum componente não estiver disponível:
use null.

EVIDÊNCIA

"amountEvidence" deve conter um trecho que mostre o valor LÍQUIDO escolhido.

Exemplo:

"Preço Líquido R$ 36,57"

"amountLabel":
label associado ao valor.

Exemplo:

"Preço Líquido"

"totalAmountEvidence":
trecho contendo o total final quando existir.

RESTITUIÇÃO

Quando o valor líquido do ENDOSSO representar dinheiro a ser devolvido
ao segurado:

"amountDirection": "refund"

Retorne amount como valor absoluto.

Exemplo:

Prêmio Líquido a Restituir: R$ 150,00

Resultado:

"amount": 150
"amountDirection": "refund"

O sistema transformará para -150.

Quando houver cobrança:

"amountDirection": "charge"

Quando estiver explicitamente sem movimentação financeira:

"amount": 0
"amountDirection": "neutral"

Se não for possível determinar o valor LÍQUIDO com segurança:

"amount": null
"amountDirection": null

Nunca use o valor total com IOF como fallback automático para amount.

COMISSÃO

"percentage" representa EXCLUSIVAMENTE o percentual de comissão do corretor.

Somente preencha quando explicitamente associado a:
- comissão;
- comissão do corretor;
- percentual de comissão;
- perc. comissão.

NÃO confunda com:
- FIPE;
- fator de ajuste;
- descontos;
- franquia;
- bônus;
- percentual de cobertura.

Na dúvida:

"percentage": null
"percentageEvidence": null

FRANQUIA

"franchise" representa SOMENTE a FRANQUIA PRINCIPAL DO CASCO
resultante do endosso.

Uma tabela pode possuir:

Descrição | LMI | Franquia | Valor do Prêmio

Cada coluna representa algo diferente.

EXEMPLO:

Compreensiva | 100% | R$ 1.973,00 (50% da Obrigatória) | R$ 1.071,27

CORRETO:

"franchise": 1973

ERRADO:

"franchise": 1071.27

R$ 1.071,27 é o prêmio da cobertura.

Quando o texto perder as colunas, confira a IMAGEM.

Não use franquias de:
- vidro;
- para-brisa;
- farol;
- lanterna;
- retrovisor;
- roda;
- pneu;
- assistência.

FORMATO POR TIPO

vehicle_conductor:

{
	"type": "vehicle_conductor",
	"typeEvidence": "string ou null",
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
		"franchiseEvidence": "string ou null",
		"amount": "number ou null",
		"amountDirection": "charge, refund, neutral ou null",
		"amountLabel": "string ou null",
		"amountEvidence": "string ou null",
		"totalAmount": "number ou null",
		"totalAmountEvidence": "string ou null",
		"iof": "number ou null",
		"interest": "number ou null",
		"fees": "number ou null",
		"percentage": "number ou null",
		"percentageEvidence": "string ou null"
	}
}

address:

{
	"type": "address",
	"typeEvidence": "string ou null",
	"lookup": {
		"plate": "string ou null",
		"insuredRegistration": "string ou null",
		"insuredName": "string ou null"
	},
	"data": {
		"postalCode": "string ou null",
		"amount": "number ou null",
		"amountDirection": "charge, refund, neutral ou null",
		"amountLabel": "string ou null",
		"amountEvidence": "string ou null",
		"totalAmount": "number ou null",
		"totalAmountEvidence": "string ou null",
		"iof": "number ou null",
		"interest": "number ou null",
		"fees": "number ou null",
		"percentage": "number ou null",
		"percentageEvidence": "string ou null"
	}
}

franchise:

{
	"type": "franchise",
	"typeEvidence": "string ou null",
	"lookup": {
		"plate": "string ou null",
		"insuredRegistration": "string ou null",
		"insuredName": "string ou null"
	},
	"data": {
		"franchise": "number ou null",
		"franchiseEvidence": "string ou null",
		"amount": "number ou null",
		"amountDirection": "charge, refund, neutral ou null",
		"amountLabel": "string ou null",
		"amountEvidence": "string ou null",
		"totalAmount": "number ou null",
		"totalAmountEvidence": "string ou null",
		"iof": "number ou null",
		"interest": "number ou null",
		"fees": "number ou null",
		"percentage": "number ou null",
		"percentageEvidence": "string ou null"
	}
}

cancellation:

{
	"type": "cancellation",
	"typeEvidence": "string ou null",
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
	"typeEvidence": "string ou null",
	"lookup": {
		"plate": "string ou null",
		"insuredRegistration": "string ou null",
		"insuredName": "string ou null"
	},
	"data": {
		"reason": "string"
	}
}

REGRAS GERAIS

- Responda APENAS JSON válido.
- JSON minificado em uma única linha.
- Sem markdown.
- Sem \`\`\`.
- Sem comentários.
- Não adicione campos.
- Todo number deve ser JSON number.
- R$ 1.234,56 => 1234.56
- Não invente dados.
- Analise TODO o documento.
- Utilize as imagens quando disponíveis.

Texto extraído:

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
	endorsementType: 'vehicle_conductor' | 'franchise',
): string {
	return `
Sua única tarefa é identificar com máxima precisão a FRANQUIA PRINCIPAL
do veículo neste ENDOSSO DE SEGURO.

Tipo já identificado:

"${endorsementType}"

${visionInstructions(imagesCount)}

NÃO extraia os demais dados.

Quando imagens estiverem disponíveis, INSPECIONE VISUALMENTE as tabelas.

Diferencie obrigatoriamente:

1. LMI
2. Franquia
3. Valor do Prêmio

OBJETIVO:

"franchise" = franquia principal vigente/resultante APÓS o endosso.

Se for alteração de franquia:

- franchise = NOVA franquia;
- previousFranchise = franquia anterior somente quando claramente indicada.

Se for substituição de veículo:

- franchise = franquia principal do veículo resultante.

EXEMPLO:

Descrição | LMI | Franquia | Valor do Prêmio

Compreensiva | 100% | R$ 1.973,00 (50% da Obrigatória) | R$ 1.071,27

Resultado:

{
	"franchise": 1973,
	"previousFranchise": null,
	"coveragePremium": 1071.27,
	"indemnityLimit": null,
	"franchiseBasis": "50% da Obrigatória",
	"evidence": "Descrição | LMI | Franquia | Valor do Prêmio ... R$ 1.973,00 (50% da Obrigatória) ... R$ 1.071,27"
}

NUNCA escolha 1071.27 como franquia nesse exemplo.

Não use franquias de:
- vidro;
- para-brisa;
- farol;
- lanterna;
- retrovisor;
- roda;
- pneu;
- assistência.

Responda somente JSON minificado:

{
	"franchise": "number ou null",
	"previousFranchise": "number ou null",
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

A resposta anterior foi inconsistente.

Motivo:

${reason}

Resposta anterior:

${JSON.stringify(previous)}

Revise novamente a IMAGEM e as colunas da tabela.

Confirme:
- Franquia;
- Valor do Prêmio;
- LMI;
- franquia anterior versus resultante.

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

A extração anterior foi considerada inconsistente.

Motivo:

${reason}

Resposta anterior:

${JSON.stringify(previous)}

REGRA MAIS IMPORTANTE PARA ESTA NOVA TENTATIVA:

"amount" deve ser o valor LÍQUIDO do endosso.

NÃO use Preço Total ou Prêmio Total quando existir:
- Preço Líquido;
- Prêmio Líquido;
- Prêmio Líquido Total;
- Valor Líquido.

IOF, juros e encargos pertencem ao PAGAMENTO e não ao valor do produto.

Revise TODO o documento e retorne somente o JSON completo corrigido.
`;
}

/**
 * ============================================================================
 * Validação financeira
 * ============================================================================
 */

function normalizeFinancialData(data: z.infer<typeof SchemaModelFinancial>): {
	amount: number;
	percentage: number | null;
} {
	if (data.amount === null) {
		throw new Error(
			'Não foi possível determinar com segurança o valor líquido do endosso',
		);
	}

	if (!data.amountEvidence) {
		throw new Error('Valor líquido do endosso identificado sem evidência');
	}

	if (!evidenceContainsValue(data.amountEvidence, data.amount)) {
		throw new Error('A evidência não confirma o valor líquido do endosso');
	}

	/**
	 * Detecta especificamente o erro que ocorreu no Allianz:
	 *
	 * líquido = 36,57
	 * IOF = 2,70
	 * total = 39,27
	 *
	 * Se amount vier igual ao total apesar de existir IOF/juros/encargos,
	 * o modelo selecionou o valor financeiro do pagamento em vez do
	 * valor líquido da negociação.
	 */
	if (
		data.totalAmount !== null &&
		moneyAlmostEqual(data.amount, data.totalAmount) &&
		((data.iof ?? 0) > 0 || (data.interest ?? 0) > 0 || (data.fees ?? 0) > 0)
	) {
		throw new Error(
			'O valor líquido do endosso foi confundido com o valor total incluindo IOF, juros ou encargos',
		);
	}

	/**
	 * Quando todos os componentes estiverem disponíveis, validamos:
	 *
	 * total =
	 * líquido + IOF + juros + encargos
	 *
	 * Fazemos essa regra somente para cobrança, pois restituições podem
	 * possuir regras tributárias diferentes dependendo da seguradora.
	 */
	const direction =
		data.amountDirection ??
		(data.amount > 0 ? 'charge' : data.amount < 0 ? 'refund' : 'neutral');

	if (
		direction === 'charge' &&
		data.totalAmount !== null &&
		data.iof !== null &&
		data.interest !== null &&
		data.fees !== null
	) {
		const expected =
			Math.abs(data.amount) + data.iof + data.interest + data.fees;

		if (!moneyAlmostEqual(expected, data.totalAmount)) {
			throw new Error(
				`Valores financeiros inconsistentes no endosso: líquido ${data.amount}, IOF ${data.iof}, juros ${data.interest}, encargos ${data.fees}, total ${data.totalAmount}`,
			);
		}
	}

	let amount: number;

	switch (direction) {
		case 'charge': {
			amount = Math.abs(data.amount);
			break;
		}

		case 'refund': {
			amount = -Math.abs(data.amount);
			break;
		}

		case 'neutral': {
			if (Math.abs(data.amount) > 0.01) {
				throw new Error(
					'Endosso neutro possui valor líquido diferente de zero',
				);
			}

			amount = 0;
			break;
		}
	}

	let percentage = data.percentage;

	if (percentage !== null) {
		if (
			!data.percentageEvidence ||
			!evidenceContainsValue(data.percentageEvidence, percentage, 0.001)
		) {
			percentage = null;
		}
	}

	return {
		amount,
		percentage,
	};
}

/**
 * ============================================================================
 * Franquia
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

	if (
		verification.coveragePremium !== null &&
		!evidenceContainsValue(verification.evidence, verification.coveragePremium)
	) {
		throw new Error('A evidência não confirma o prêmio da cobertura');
	}
}

async function verifyFranchise({
	model,
	text,
	images,
	endorsementType,
}: {
	model: string;
	text: string;
	images: Array<string>;
	endorsementType: 'vehicle_conductor' | 'franchise';
}): Promise<FranchiseVerification> {
	const prompt = mountFranchiseVerificationPrompt(
		text,
		images.length,
		endorsementType,
	);

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
			'[extract-endorsement] primeira verificação de franquia inconsistente:',
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
 * Normalização
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

function validateBaseModelOutput(raw: ModelOutput): void {
	switch (raw.type) {
		case 'vehicle_conductor':
		case 'address':
		case 'franchise': {
			normalizeFinancialData(raw.data);
			break;
		}

		case 'cancellation':
		case 'unknown': {
			break;
		}
	}
}

function finalizeModelOutput(raw: ModelOutput): DataExtractEndorsement {
	if (raw.type === 'unknown') {
		throw new Error(
			`Tipo de endosso não suportado ou não identificado com segurança: ${raw.data.reason}`,
		);
	}

	const lookup = normalizeLookup(raw.lookup);

	switch (raw.type) {
		case 'vehicle_conductor': {
			const financial = normalizeFinancialData(raw.data);

			return SchemaDataExtractVehicleConductor.parse({
				type: 'vehicle_conductor',

				lookup,

				data: {
					driver: raw.data.driver,

					plate: normalizePlate(raw.data.plate),

					model: raw.data.model,

					modelYear: raw.data.modelYear,

					franchise: raw.data.franchise,

					amount: financial.amount,

					percentage: financial.percentage,
				},
			});
		}

		case 'address': {
			if (!raw.data.postalCode) {
				throw new Error(
					'Endosso de endereço identificado sem novo CEP de pernoite',
				);
			}

			const financial = normalizeFinancialData(raw.data);

			return SchemaDataExtractAddress.parse({
				type: 'address',

				lookup,

				data: {
					postalCode: raw.data.postalCode,

					amount: financial.amount,

					percentage: financial.percentage,
				},
			});
		}

		case 'franchise': {
			if (raw.data.franchise === null) {
				throw new Error(
					'Endosso de franquia identificado sem o novo valor da franquia',
				);
			}

			const financial = normalizeFinancialData(raw.data);

			return SchemaDataExtractFranchise.parse({
				type: 'franchise',

				lookup,

				data: {
					franchise: raw.data.franchise,

					amount: financial.amount,

					percentage: financial.percentage,
				},
			});
		}

		case 'cancellation': {
			if (!raw.data.effectivedAt) {
				throw new Error(
					'Endosso de cancelamento identificado sem data de efetivação',
				);
			}

			return SchemaDataExtractCancellation.parse({
				type: 'cancellation',

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
	const prompt = mountPrompt(text, images.length);

	let previous: unknown;
	let parsed: ModelOutput;

	try {
		previous = await askJson({
			model,
			prompt,
			images,
		});

		parsed = SchemaModelOutput.parse(previous);

		validateBaseModelOutput(parsed);
	} catch (firstError) {
		const reason = errorMessage(firstError);

		console.warn(
			'[extract-endorsement] primeira extração inconsistente:',
			reason,
		);

		const retried = await askJson({
			model,

			prompt: mountRetryPrompt(prompt, previous, reason),

			images,
		});

		parsed = SchemaModelOutput.parse(retried);

		validateBaseModelOutput(parsed);
	}

	switch (parsed.type) {
		case 'vehicle_conductor': {
			const verification = await verifyFranchise({
				model,
				text,
				images,
				endorsementType: 'vehicle_conductor',
			});

			parsed = {
				...parsed,

				data: {
					...parsed.data,

					franchise: verification.franchise,

					franchiseEvidence: verification.evidence,
				},
			};

			break;
		}

		case 'franchise': {
			const verification = await verifyFranchise({
				model,
				text,
				images,
				endorsementType: 'franchise',
			});

			parsed = {
				...parsed,

				data: {
					...parsed.data,

					franchise: verification.franchise,

					franchiseEvidence: verification.evidence,
				},
			};

			break;
		}

		case 'address':
		case 'cancellation':
		case 'unknown': {
			break;
		}
	}

	return finalizeModelOutput(parsed);
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
 * Localização do seguro
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
				 * v8:
				 *
				 * - amount agora é LÍQUIDO;
				 * - IOF/juros/encargos não entram em amount;
				 * - total financeiro passa a ser somente campo auxiliar;
				 * - validação detecta líquido confundido com total;
				 * - verificação especializada de franquia.
				 */
				const cacheKey = `endorsement-pdf-extract:v8:${hash}`;

				const cached = await ctx.cache.get(cacheKey);

				let extracted: DataExtractEndorsement | null = null;

				if (cached) {
					try {
						extracted = SchemaDataExtractEndorsement.parse(JSON.parse(cached));
					} catch (error) {
						console.warn(
							'[extract-endorsement] cache incompatível, executando nova extração:',
							error instanceof Error ? error.message : error,
						);
					}
				}

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
