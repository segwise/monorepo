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
	 * Placas brasileiras possuem 7 caracteres.
	 *
	 * Essa validação também evita um erro frequente da extração textual:
	 * interpretar um chassi de 17 caracteres como se fosse a placa.
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
				/**
				 * Um endosso de vehicle_conductor pode alterar apenas o
				 * veículo ou apenas o condutor.
				 *
				 * Por isso esses dados não são artificialmente obrigatórios.
				 */
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
				 * Convenção financeira:
				 *
				 * positivo = segurado deve pagar
				 * negativo = segurado receberá restituição/crédito
				 * zero     = sem movimentação financeira
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
 * Schemas da resposta bruta da IA
 *
 * São intencionalmente mais permissivos.
 *
 * Depois fazemos validação/normalização em TypeScript e somente então
 * construímos SchemaDataExtractEndorsement.
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
		amount: SchemaModelMoneyNullable,

		amountDirection: z.enum(['charge', 'refund', 'neutral']).nullable(),

		amountLabel: z.string().nullable(),

		amountEvidence: z.string().nullable(),

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
 * Prompt
 * ============================================================================
 */

function mountPrompt(text: string, imagesCount: number): string {
	return `
Extraia os dados do ENDOSSO DE SEGURO presente no documento abaixo.

O documento pode ser de QUALQUER seguradora.
O layout, nomes dos campos, títulos, tabelas e organização das páginas podem variar.

${visionInstructions(imagesCount)}

IMPORTANTE SOBRE O PDF

O texto foi extraído automaticamente de um PDF e pode apresentar perda da
estrutura visual.

A extração textual pode:
- inverter colunas;
- colocar valores abaixo do label errado;
- perder alinhamento;
- misturar tabelas;
- colocar chassi abaixo do campo "Placa";
- misturar franquia com prêmio;
- misturar parcelas da apólice original com dados do endosso;
- separar o cabeçalho de uma tabela dos respectivos valores.

Quando imagens das páginas forem fornecidas, utilize também a estrutura VISUAL
da página para decidir qual valor pertence a qual campo.

Quando o texto linearizado e a disposição visual parecerem contraditórios,
prefira a estrutura visual da página.

Analise TODO o documento antes de responder.

Nunca invente dados.

TIPO DO ENDOSSO

Identifique exatamente um destes tipos:

1. "vehicle_conductor"

Use quando a FINALIDADE PRINCIPAL do endosso for:
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

A simples presença de uma franquia no documento NÃO significa que o endosso
é do tipo "franchise".

Documentos de substituição de veículo normalmente apresentam a franquia
resultante e continuam sendo "vehicle_conductor".

4. "cancellation"

Use quando a FINALIDADE PRINCIPAL for:
- cancelamento;
- rescisão;
- encerramento da apólice;
- encerramento do seguro.

5. "unknown"

Use "unknown" quando:
- não for possível determinar o tipo com segurança;
- o documento representar outro tipo de endosso;
- alteração somente de cobertura;
- alteração somente de importância segurada;
- alteração somente de forma de pagamento;
- qualquer alteração não enquadrada com segurança nos quatro tipos anteriores.

NUNCA escolha um tipo incorreto somente para evitar retornar "unknown".

"typeEvidence" deve conter um trecho CURTO do próprio documento que ajude
a justificar a classificação.

Não explique o raciocínio.
Apenas transcreva a evidência.

LOOKUP

"lookup" serve para ajudar a identificar o seguro ao qual o endosso pertence.

Formato:

{
	"plate": "string ou null",
	"insuredRegistration": "string ou null",
	"insuredName": "string ou null"
}

Regras:

- "insuredRegistration":
  CPF ou CNPJ do SEGURADO.

  Nunca use CPF/CNPJ:
  - do corretor;
  - do titular do cartão;
  - do principal condutor quando ele não for o segurado;
  - de terceiro.

- "insuredName":
  nome ou razão social do SEGURADO.

- "plate":
  placa relacionada ao seguro.

PLACA E CHASSI

Tenha extremo cuidado.

- Placa brasileira normalmente possui 7 caracteres alfanuméricos.
- Chassi normalmente possui 17 caracteres.
- NUNCA interprete um chassi como placa.

Os seguintes valores significam ausência de placa:
- "-"
- "A AVISAR"
- "AVISAR"
- "SEM PLACA"
- "S/ PLACA"
- equivalentes.

Nesses casos use null.

ENDOSSO DE SUBSTITUIÇÃO

Se o documento mostrar claramente placa anterior e placa nova:

- lookup.plate = placa anterior;
- data.plate = placa nova/resultante.

Se houver somente uma placa no documento e não for possível determinar
com segurança que ela seja a placa anterior, utilize essa placa em
lookup.plate e também utilize a placa resultante em data.plate quando
ela representar o veículo após o endosso.

VALOR FINANCEIRO DO ENDOSSO

"amount" representa o EFEITO FINANCEIRO TOTAL FINAL DO ENDOSSO.

Ele NÃO representa apenas o prêmio líquido.

Quando existir um valor final incluindo:
- IOF;
- juros;
- encargos;

utilize o TOTAL FINAL.

As seguradoras podem utilizar rótulos diferentes, por exemplo:

- Preço Total
- Prêmio Total
- Prêmio Total do Endosso
- Valor Total
- Valor Total do Endosso
- Total a Pagar
- Prêmio Adicional
- Adicional a Pagar
- Diferença de Prêmio
- Saldo a Pagar
- Valor a Restituir
- Prêmio a Restituir
- Restituição
- Crédito
- Estorno

Esses rótulos são apenas exemplos.
A lista NÃO é fechada.

Interprete semanticamente a operação.

EXEMPLO 1

Prêmio Líquido Total: R$ 374,29
Juros: R$ 0,00
IOF: R$ 27,62
Prêmio Total: R$ 401,91

Resultado:

"amount": 401.91
"amountDirection": "charge"
"amountLabel": "Prêmio Total"
"amountEvidence": "Prêmio Total R$ 401,91"

EXEMPLO 2

Preço Líquido: R$ 36,57
IOF: R$ 2,70
Preço Total: R$ 39,27

Resultado:

"amount": 39.27
"amountDirection": "charge"
"amountLabel": "Preço Total"
"amountEvidence": "Preço Total R$ 39,27"

NÃO use como amount:

- franquia;
- LMI;
- limite máximo de indenização;
- FIPE;
- valor individual de cobertura;
- prêmio individual de cobertura;
- IOF isoladamente;
- juros isoladamente;
- encargos isoladamente;
- assistência;
- valor de vidro;
- valor de farol;
- valor de parcela quando existir total explícito;
- comissão;
- percentual;
- valor total original da apólice anterior.

RESTITUIÇÃO

Quando o segurado tiver valor a RECEBER:

"amountDirection": "refund"

O valor de "amount" deve ser informado como valor absoluto positivo.
O sistema fará a conversão para valor negativo posteriormente.

Exemplo:

Prêmio a restituir: R$ 150,00

Resultado:

"amount": 150
"amountDirection": "refund"
"amountLabel": "Prêmio a restituir"
"amountEvidence": "Prêmio a restituir R$ 150,00"

SEM MOVIMENTAÇÃO FINANCEIRA

Somente use:

"amount": 0
"amountDirection": "neutral"

quando o documento indicar explicitamente que não existe cobrança nem
restituição.

Se não for possível determinar com segurança o valor financeiro:

"amount": null
"amountDirection": null
"amountLabel": null
"amountEvidence": null

Nunca use zero para representar valor desconhecido.

EVIDÊNCIA FINANCEIRA

"amountEvidence" deve ser o MENOR trecho do documento suficiente para
confirmar o valor escolhido.

Não explique.
Não faça resumo.
Apenas transcreva o trecho.

COMISSÃO

"percentage" representa EXCLUSIVAMENTE o percentual de comissão do corretor
referente ao endosso.

Somente preencha quando estiver explicitamente associado a termos como:
- comissão;
- comissão do corretor;
- percentual de comissão;
- perc. comissão.

NÃO confunda comissão com:
- percentual FIPE;
- fator de ajuste;
- desconto;
- participação;
- franquia reduzida;
- percentual da franquia;
- bônus;
- percentual de cobertura.

Na dúvida:

"percentage": null
"percentageEvidence": null

Quando preencher percentage, "percentageEvidence" deve conter um trecho
do documento que mostre explicitamente o percentual de comissão.

FRANQUIA

Quando houver o campo "franchise", retorne somente a FRANQUIA PRINCIPAL
DO CASCO.

Ela pode aparecer como:
- franquia básica;
- franquia obrigatória;
- participação obrigatória;
- 25% da básica;
- 50% da obrigatória;
- franquia compreensiva.

NÃO use:
- franquia de para-brisa;
- franquia de vidro;
- franquia de vidro lateral;
- franquia de farol;
- franquia de lanterna;
- franquia de retrovisor;
- franquia de assistência;
- franquia de qualquer serviço específico.

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
		"driver": "string ou null, CPF do principal condutor após o endosso",
		"plate": "string ou null, placa resultante após o endosso",
		"model": "string ou null, modelo resultante após o endosso",
		"modelYear": "string, number ou null",
		"franchise": "number ou null",
		"amount": "number ou null",
		"amountDirection": "charge, refund, neutral ou null",
		"amountLabel": "string ou null",
		"amountEvidence": "string ou null",
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
		"amount": "number ou null",
		"amountDirection": "charge, refund, neutral ou null",
		"amountLabel": "string ou null",
		"amountEvidence": "string ou null",
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
- Responda em uma única linha minificada.
- Não use markdown.
- Não use \`\`\`.
- Não escreva comentários.
- Não adicione campos diferentes dos especificados.
- Todo campo number deve ser JSON number.
- R$ 1.234,56 => 1234.56
- R$ 39,27 => 39.27
- 15% => 15
- Nunca invente informações ausentes.
- Analise o documento inteiro antes de responder.
- Use as imagens para confirmar tabelas e associação entre campos quando disponíveis.

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

Motivo da inconsistência:

${reason}

Resposta anterior:

${JSON.stringify(previous)}

Revise TODO o documento novamente.

Dê atenção especial a:
- finalidade real do endosso;
- valor total final;
- prêmio líquido versus prêmio total;
- IOF;
- restituição versus cobrança;
- franquia principal;
- placa versus chassi;
- segurado versus condutor;
- segurado versus titular do cartão.

Retorne novamente SOMENTE o JSON completo corrigido.
`;
}

/**
 * ============================================================================
 * Normalização financeira
 * ============================================================================
 */

function normalizeFinancialData(data: z.infer<typeof SchemaModelFinancial>): {
	amount: number;
	percentage: number | null;
} {
	if (data.amount === null) {
		throw new Error(
			'Não foi possível determinar com segurança o valor financeiro do endosso',
		);
	}

	if (!data.amountEvidence) {
		throw new Error('Valor do endosso identificado sem evidência no documento');
	}

	if (!evidenceContainsValue(data.amountEvidence, data.amount)) {
		throw new Error(
			'A evidência apresentada não confirma o valor financeiro do endosso',
		);
	}

	let direction = data.amountDirection;

	/**
	 * Tolerância para o caso do modelo omitir direction apesar de ter
	 * encontrado corretamente o valor.
	 */
	if (!direction) {
		if (data.amount > 0) {
			direction = 'charge';
		} else if (data.amount < 0) {
			direction = 'refund';
		} else {
			direction = 'neutral';
		}
	}

	let amount: number;

	switch (direction) {
		case 'charge': {
			amount = Math.abs(data.amount);
			break;
		}

		case 'refund': {
			/**
			 * Convenção interna:
			 *
			 * restituição/crédito é armazenado como valor negativo.
			 */
			amount = -Math.abs(data.amount);
			break;
		}

		case 'neutral': {
			if (Math.abs(data.amount) > 0.01) {
				throw new Error(
					'Endosso identificado como financeiramente neutro, mas contém valor diferente de zero',
				);
			}

			amount = 0;
			break;
		}
	}

	let percentage = data.percentage;

	/**
	 * Comissão possui grande possibilidade de falso positivo.
	 *
	 * Se o modelo não conseguir apontar um trecho que contenha
	 * explicitamente o percentual encontrado, descartamos o valor.
	 */
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
 * Normalização da resposta da IA
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

	try {
		previous = await askJson({
			model,
			prompt,
			images,
		});

		const parsed = SchemaModelOutput.parse(previous);

		return finalizeModelOutput(parsed);
	} catch (firstError) {
		const reason = errorMessage(firstError);

		console.warn(
			'[extract-endorsement] primeira extração inconsistente:',
			reason,
		);

		/**
		 * O segundo request só acontece quando a primeira extração
		 * realmente falhou em schema ou validação semântica.
		 *
		 * Assim os PDFs simples continuam usando somente uma chamada.
		 */
		const retried = await askJson({
			model,

			prompt: mountRetryPrompt(prompt, previous, reason),

			images,
		});

		const parsed = SchemaModelOutput.parse(retried);

		return finalizeModelOutput(parsed);
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

	/**
	 * Primeiro tentamos pela placa.
	 *
	 * Ela tende a ser o identificador mais forte quando não houve
	 * substituição de veículo.
	 */
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

	/**
	 * Fallback para situações como substituição de veículo.
	 *
	 * Nesse caso a única placa encontrada no documento pode ser a NOVA,
	 * que naturalmente ainda não existe no cadastro.
	 *
	 * Só usamos CPF/CNPJ automaticamente quando encontramos exatamente
	 * um único seguro, evitando escolher aleatoriamente quando a mesma
	 * pessoa possui mais de um veículo/apólice.
	 */
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
				/**
				 * Quando o frontend já sabe a qual seguro o endosso
				 * pertence, pode informar o id.
				 *
				 * Caso contrário tentamos fazer o lookup pelo PDF.
				 */
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
				 * Alterar a versão sempre que regras/schema/prompt forem
				 * modificados de forma relevante.
				 */
				const cacheKey = `endorsement-pdf-extract:v6:${hash}`;

				const cached = await ctx.cache.get(cacheKey);

				let extracted: DataExtractEndorsement;
				let shouldCache = !cached;

				if (cached) {
					try {
						extracted = SchemaDataExtractEndorsement.parse(JSON.parse(cached));
					} catch (error) {
						console.warn(
							'[extract-endorsement] cache incompatível, executando nova extração:',
							error instanceof Error ? error.message : error,
						);

						extracted = await extractDataEndorsement(buffer);

						shouldCache = true;
					}
				} else {
					extracted = await extractDataEndorsement(buffer);
				}

				if (shouldCache) {
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
