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

	const hasComma = normalized.includes(',');

	if (hasComma) {
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
	 * Evita um erro muito comum em PDFs:
	 * o texto linearizado pode colocar o chassi abaixo do label "Placa".
	 *
	 * Placa brasileira atual/antiga = 7 caracteres.
	 * Chassi geralmente = 17 caracteres.
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

	const absolute = Math.abs(value);

	return numericValuesFromText(evidence).some(
		(candidate) => Math.abs(Math.abs(candidate) - absolute) <= tolerance,
	);
}

function errorMessage(error: unknown): string {
	return error instanceof Error
		? error.message
		: 'Falha desconhecida na validação';
}

/**
 * ============================================================================
 * Schemas finais da API
 * ============================================================================
 */

const SchemaLookup = z
	.object({
		plate: SchemaPlateLenient,
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
				/**
				 * Esses campos são nullable porque um endosso pode alterar
				 * apenas veículo OU apenas condutor.
				 *
				 * Não devemos obrigar a IA a inventar os dados que não aparecem.
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
					.nonnegative()
					.nullish(),

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
				franchise: z.number('Valor da frânquia inválido').nonnegative(),

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

/**
 * ============================================================================
 * Schema que a IA pode devolver
 *
 * É deliberadamente mais permissivo do que o schema final.
 * ============================================================================
 */

const SchemaModelMoney = z.preprocess(
	parseBrazilianNumber,
	z.number().finite(),
);

const SchemaModelMoneyNullable = SchemaModelMoney.nullable();

const SchemaModelPercentage = z.preprocess(
	parseBrazilianNumber,
	z.number().finite(),
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

		/**
		 * charge:
		 * segurado paga valor adicional.
		 *
		 * refund:
		 * segurado recebe crédito/restituição.
		 *
		 * neutral:
		 * nenhuma movimentação financeira.
		 */
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
Extraia os dados do ENDOSSO DE SEGURO presente no documento.

O documento pode ser de QUALQUER seguradora e pode possuir qualquer layout.
Os nomes dos campos, tabelas, títulos e organização das páginas podem variar.

${visionInstructions(imagesCount)}

IMPORTANTE SOBRE O PDF

O texto foi extraído automaticamente de um PDF.

A extração textual pode:
- inverter colunas;
- colocar valores abaixo do label errado;
- perder alinhamento;
- misturar tabelas;
- colocar chassi abaixo do campo "Placa";
- misturar franquia com prêmio;
- misturar parcelas da apólice original com parcelas do endosso.

Quando imagens das páginas estiverem disponíveis, use a estrutura VISUAL da
página para determinar qual valor pertence a qual campo.

Quando a disposição visual da página contradizer o texto linearizado,
prefira a estrutura visual da página.

Analise TODO o documento antes de responder.

Nunca invente dados.

TIPO DO ENDOSSO

Identifique exatamente um destes tipos:

1. "vehicle_conductor"

Use quando a finalidade principal do endosso for:
- substituição de veículo;
- alteração de veículo;
- troca de placa;
- troca de modelo;
- alteração do principal condutor;
- inclusão/substituição de condutor.

2. "address"

Use quando a finalidade principal for:
- alteração de CEP de pernoite;
- alteração de local de risco;
- alteração de endereço relacionado ao risco.

3. "franchise"

Use SOMENTE quando a finalidade principal do endosso for alterar a franquia.

A simples presença de uma franquia no documento NÃO significa que o endosso
é do tipo "franchise".

Documentos de substituição de veículo normalmente também mostram a franquia,
mas continuam sendo "vehicle_conductor".

4. "cancellation"

Use quando a finalidade principal for:
- cancelamento;
- rescisão;
- encerramento da apólice/seguro.

5. "unknown"

Use "unknown" quando:
- não for possível determinar com segurança;
- o endosso for de outro tipo;
- for alteração somente de cobertura;
- alteração somente de importância segurada;
- alteração somente de forma de pagamento;
- ou qualquer operação não enquadrada com segurança nos quatro tipos acima.

NUNCA escolha um dos quatro tipos apenas para evitar retornar "unknown".

"typeEvidence" deve conter um trecho CURTO do documento que ajude a justificar
a classificação.

Não explique seu raciocínio. Apenas transcreva a evidência.

LOOKUP

"lookup" serve para identificar o seguro ao qual o endosso pertence.

{
	"plate": string | null,
	"insuredRegistration": string | null,
	"insuredName": string | null
}

Regras:

- insuredRegistration:
  CPF/CNPJ do SEGURADO, nunca do corretor, titular do cartão, condutor ou terceiro.

- insuredName:
  nome/razão social do SEGURADO.

- plate:
  placa relacionada ao seguro.

CUIDADO COM PLACA E CHASSI:

- Placa brasileira normalmente possui 7 caracteres alfanuméricos.
- Chassi normalmente possui 17 caracteres.
- NUNCA use o chassi como placa.
- "-", "A AVISAR", "SEM PLACA" e equivalentes => null.

Em endosso de substituição de veículo, se o documento apresentar claramente
placa anterior e placa nova:
- lookup.plate = placa anterior;
- data.plate = placa nova.

Se houver somente uma placa no documento e não for possível determinar que
ela é a anterior, use essa placa em lookup.plate também.

VALOR FINANCEIRO DO ENDOSSO

"amount" representa o EFEITO FINANCEIRO TOTAL FINAL DO ENDOSSO.

Isto é diferente do prêmio líquido.

Quando houver um total final incluindo:
- IOF;
- juros;
- encargos;

use o TOTAL FINAL.

Exemplos de labels possíveis:

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

A lista acima NÃO é fechada.

Interprete semanticamente o documento.

PRIORIDADE FINANCEIRA

Se houver:

Prêmio Líquido Total: R$ 374,29
Juros: R$ 0,00
IOF: R$ 27,62
Prêmio Total: R$ 401,91

retorne:

"amount": 401.91
"amountDirection": "charge"

Se houver:

Preço Líquido: R$ 36,57
IOF: R$ 2,70
Preço Total: R$ 39,27

retorne:

"amount": 39.27
"amountDirection": "charge"

NÃO use como amount:
- franquia;
- LMI;
- limite de indenização;
- FIPE;
- preço individual de cobertura;
- prêmio individual de cobertura;
- IOF isoladamente;
- juros isoladamente;
- valor de assistência;
- valor de vidro;
- valor de parcela quando existir um total explícito;
- comissão;
- percentual;
- valor original da apólice.

RESTITUIÇÃO

Se o segurado tiver valor a RECEBER:

"amountDirection": "refund"

e "amount" deve representar o valor monetário correspondente.

Exemplo:

Prêmio a restituir: R$ 150,00

=>

"amount": 150.00
"amountDirection": "refund"

O sistema fará a normalização do sinal posteriormente.

SEM MOVIMENTAÇÃO FINANCEIRA

Somente use:

"amount": 0
"amountDirection": "neutral"

quando o documento indicar explicitamente que não existe cobrança nem
restituição.

Se NÃO encontrar o valor financeiro:
- amount = null
- amountDirection = null

Nunca use 0 para representar "não encontrado".

EVIDÊNCIA FINANCEIRA

"amountLabel":
label associado ao valor escolhido.

"amountEvidence":
menor trecho do documento que contenha o valor escolhido.

Exemplo:

"amountLabel": "Prêmio Total"
"amountEvidence": "Prêmio Total R$ 401,91"

Não escreva explicações.

COMISSÃO

"percentage" representa EXCLUSIVAMENTE percentual de comissão do corretor
referente ao endosso.

Somente preencha quando estiver explicitamente relacionado a:
- comissão;
- comissão do corretor;
- percentual de comissão;
- perc. comissão.

NÃO confunda comissão com:
- % FIPE;
- fator de ajuste;
- desconto;
- franquia reduzida;
- percentual da franquia;
- participação;
- bônus;
- percentual de cobertura.

Na dúvida:

"percentage": null
"percentageEvidence": null

Se preencher percentage, "percentageEvidence" deve conter o trecho que mostra
explicitamente a comissão.

FRANQUIA

Quando houver campo "franchise", retorne somente a FRANQUIA PRINCIPAL DO CASCO.

Pode aparecer como:
- franquia básica;
- franquia obrigatória;
- participação obrigatória;
- 25% da básica;
- 50% da obrigatória;
- franquia compreensiva.

NÃO use:
- franquia de para-brisa;
- franquia de vidro lateral;
- franquia de farol;
- franquia de lanterna;
- franquia de retrovisor;
- franquia de assistência;
- franquia de serviço específico.

FORMATO DE SAÍDA

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
- JSON minificado em uma única linha.
- Sem markdown.
- Sem \`\`\`.
- Sem comentários.
- Não adicione campos.
- Valores monetários devem ser number.
- R$ 1.234,56 => 1234.56
- R$ -150,40 => -150.40
- Percentual 15% => 15
- Não invente dados.
- Analise o documento inteiro.
- Use as imagens para confirmar tabelas e campos quando disponíveis.

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

Revise TODO o documento novamente, principalmente tabelas, cabeçalhos,
totais financeiros, franquia, placa/chassi e finalidade real do endosso.

Retorne novamente SOMENTE o JSON completo corrigido.
`;
}

/**
 * ============================================================================
 * Normalização/validação
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
		throw new Error('A evidência informada não confirma o valor do endosso');
	}

	let direction = data.amountDirection;

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
			 * restituição/crédito = valor negativo.
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

	let percentage: number | null = data.percentage;

	/**
	 * Comissão é um campo com enorme possibilidade de falso positivo.
	 *
	 * Se a IA não conseguir apontar o trecho que contém explicitamente
	 * o percentual, descartamos a comissão em vez de inventar.
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
				type: raw.type,
				lookup,
				data: {
					driver: raw.data.driver,
					plate: normalizePlate(raw.data.plate),
					model: raw.data.model,
					modelYear: raw.data.modelYear,
					franchise: raw.data.franchise,
					...financial,
				},
			});
		}

		case 'address': {
			if (!raw.data.postalCode) {
				throw new Error('Endosso de endereço sem novo CEP identificado');
			}

			const financial = normalizeFinancialData(raw.data);

			return SchemaDataExtractAddress.parse({
				type: raw.type,
				lookup,
				data: {
					postalCode: raw.data.postalCode,
					...financial,
				},
			});
		}

		case 'franchise': {
			if (raw.data.franchise === null) {
				throw new Error(
					'Endosso de franquia sem o novo valor da franquia identificado',
				);
			}

			const financial = normalizeFinancialData(raw.data);

			return SchemaDataExtractFranchise.parse({
				type: raw.type,
				lookup,
				data: {
					franchise: raw.data.franchise,
					...financial,
				},
			});
		}

		case 'cancellation': {
			if (!raw.data.effectivedAt) {
				throw new Error(
					'Endosso de cancelamento sem data de efetivação identificada',
				);
			}

			return SchemaDataExtractCancellation.parse({
				type: raw.type,
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
		 * Retry somente quando a primeira extração falhou.
		 *
		 * Não dobramos o custo/latência dos documentos que já foram
		 * interpretados corretamente na primeira tentativa.
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

	/**
	 * Fallback importante para substituição de veículo:
	 *
	 * a única placa encontrada no documento pode ser a placa NOVA,
	 * que ainda não existe no cadastro atual.
	 *
	 * CPF/CNPJ só é utilizado automaticamente quando existir exatamente
	 * um seguro candidato, evitando vincular o endosso ao carro errado
	 * quando o segurado possuir múltiplas apólices.
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
				 * Opcional.
				 *
				 * Se vier do frontend, tem prioridade.
				 * Caso contrário tentamos localizar pelo próprio PDF.
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
				 * Nova versão porque:
				 * - amount passou a representar total final;
				 * - há validação de evidência;
				 * - restituição tem sinal negativo;
				 * - classificação ganhou unknown;
				 * - regras de placa/chassi foram alteradas.
				 */
				const cacheKey = `endorsement-pdf-extract:v6:${hash}`;

				const cached = await ctx.cache.get(cacheKey);

				let extracted: DataExtractEndorsement;

				if (cached) {
					try {
						extracted = SchemaDataExtractEndorsement.parse(JSON.parse(cached));
					} catch {
						/**
						 * Cache de schema inválido nunca deve impedir
						 * uma nova tentativa de extração.
						 */
						extracted = await extractDataEndorsement(buffer);
					}
				} else {
					extracted = await extractDataEndorsement(buffer);
				}

				if (!cached) {
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
