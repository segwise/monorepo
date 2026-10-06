import { zValidator } from '@hono/zod-validator';
import { maskNumber, SchemaDateString, SchemaPostalCode } from '@segwise/core';
import { z } from 'zod';
import type { Database } from '@/@types/database';
import type { Server } from '@/@types/server';
import type { Prisma } from '@/generated/prisma/client';
import {
	askJson,
	runPdfExtraction,
	SchemaPlateLenient,
	visionInstructions,
} from '@/libraries/ai/pdf-extraction';
import { EXCLUDED_PRODUCER_ID } from '@/libraries/dashboard/metrics';

const SchemaLookup = z
	.object({
		plate: SchemaPlateLenient,
		insuredRegistration: z.string().nullish(),
		insuredName: z.string().nullish(),
	})
	.strict();

/**
 * Metadados internos utilizados para aumentar a confiabilidade
 * da extração financeira.
 *
 * Estes campos não precisam ser enviados ao frontend.
 */
const SchemaFinancialExtraction = z
	.object({
		amount: z.number('Valor do endosso inválido').nullable(),
		percentage: z.number('Percentual de comissão inválido').nullish(),
		amountDirection: z.enum(['charge', 'refund', 'neutral']).nullable(),
		amountEvidence: z.string().nullable(),
		amountLabel: z.string().nullable(),
	})
	.strict();

const SchemaDataExtractVehicleConductor = z
	.object({
		type: z.literal('vehicle_conductor'),
		lookup: SchemaLookup,
		data: z
			.object({
				driver: z
					.string('CPF do condutor inválido')
					.min(1, 'CPF do condutor inválido'),
				plate: SchemaPlateLenient,
				model: z.string('Modelo do veículo inválido'),
				modelYear: z.union([z.string(), z.number()]).nullish(),
				franchise: z.number('Valor da frânquia inválido'),
			})
			.merge(SchemaFinancialExtraction)
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
			})
			.merge(SchemaFinancialExtraction)
			.strict(),
	})
	.strict();

const SchemaDataExtractFranchise = z
	.object({
		type: z.literal('franchise'),
		lookup: SchemaLookup,
		data: z
			.object({
				franchise: z.number('Valor da frânquia inválido'),
			})
			.merge(SchemaFinancialExtraction)
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

function mountPrompt(text: string, imagesCount: number): string {
	return `
Extraia os dados do endosso de seguro presente no documento abaixo.

O documento pode ser de QUALQUER seguradora e o layout, os nomes dos campos,
a organização das páginas e a terminologia podem variar.
${visionInstructions(imagesCount)}

Analise TODO o documento antes de responder.

IMPORTANTE:
- O texto foi extraído de um PDF e pode perder tabelas, colunas, alinhamento,
  hierarquia visual e associação entre rótulos e valores.
- Quando imagens das páginas forem fornecidas, utilize também a informação
  visual para entender tabelas, campos, títulos, valores e relações que possam
  ter sido perdidas na extração textual.
- Não assuma que um valor próximo de um determinado texto pertence àquele
  campo sem considerar o contexto visual e semântico.
- Nunca invente informações.

TIPO DO ENDOSSO

Primeiro identifique exatamente um dos seguintes tipos:

- "vehicle_conductor":
  alteração de veículo e/ou condutor, incluindo troca de veículo, placa,
  modelo ou condutor principal.

- "address":
  alteração de endereço ou CEP de pernoite do veículo.

- "franchise":
  alteração de franquia.

- "cancellation":
  cancelamento da apólice, seguro ou proposta.

Se o documento utilizar outra terminologia, determine o tipo pelo significado
da alteração realizada, e não apenas pelo título utilizado pela seguradora.

LOOKUP

Todos os tipos possuem "lookup", utilizado para identificar o seguro ao qual
o endosso pertence:

{
  "plate": "string ou null",
  "insuredRegistration": "string ou null",
  "insuredName": "string ou null"
}

Regras do lookup:

- "plate":
  placa do veículo segurado relacionado ao endosso.
  Se houver placa anterior e nova placa, utilize preferencialmente a placa
  que permita identificar a apólice/seguro existente.
  Se existir apenas uma placa no documento, utilize-a.
  Se constar "A AVISAR", "SEM PLACA" ou equivalente, use null.

- "insuredRegistration":
  CPF ou CNPJ do segurado.
  Retorne somente um CPF ou CNPJ.
  Não utilize CPF de corretor, condutor ou terceiro como CPF do segurado.

- "insuredName":
  nome ou razão social do segurado.
  Não utilize nome do corretor, condutor ou terceiro como nome do segurado,
  exceto quando também forem explicitamente o segurado.

VALOR FINANCEIRO DO ENDOSSO

Para todos os tipos que possuem "amount", determine o EFEITO FINANCEIRO TOTAL
DO ENDOSSO para o segurado.

O campo "amount" NÃO representa:
- valor da franquia;
- limite de indenização;
- importância segurada;
- valor FIPE;
- valor individual de uma cobertura;
- prêmio individual de uma cobertura;
- IOF isoladamente;
- juros isoladamente;
- comissão;
- percentual;
- desconto isoladamente;
- valor de serviço;
- valor de assistência;
- valor de acessórios.

Procure o valor FINAL da operação de endosso.

As seguradoras podem utilizar nomes diferentes, por exemplo:

- preço total;
- prêmio total;
- prêmio do endosso;
- valor do endosso;
- total do endosso;
- prêmio adicional;
- adicional a pagar;
- diferença de prêmio;
- valor a pagar;
- saldo a pagar;
- total a pagar;
- prêmio a restituir;
- valor a restituir;
- devolução;
- restituição;
- crédito;
- estorno;
- prêmio líquido;
- prêmio emitido;
- prêmio final.

Esses nomes são exemplos e NÃO constituem uma lista fechada.
Interprete o significado financeiro do campo no contexto do documento.

REGRA DE PRIORIDADE DO VALOR

Quando houver mais de um valor financeiro:

1. Prefira o valor explicitamente identificado como TOTAL ou FINAL
   da operação/endosso.

2. Se houver um valor líquido e outro valor total incluindo impostos,
   IOF, encargos ou juros, utilize o TOTAL FINAL.

3. Se o documento apresentar separadamente:
   - prêmio líquido;
   - IOF;
   - juros;
   - encargos;
   - parcelas;
   - total;

   utilize o TOTAL explicitamente informado.

4. NÃO some manualmente componentes quando o documento já apresentar
   um total final.

5. NÃO utilize o valor de uma parcela quando existir um valor total
   explicitamente informado.

6. Se houver somente parcelas e nenhum total explícito, determine o total
   apenas quando o documento deixar inequivocamente claro a quantidade e
   o valor das parcelas.

7. Se existirem valores anterior e posterior do seguro, não escolha
   simplesmente o maior ou o mais recente. Procure o valor que represente
   especificamente o efeito financeiro do ENDOSSO.

8. Se houver valor a pagar pelo segurado:
   - amountDirection = "charge"
   - amount deve ser positivo.

9. Se houver restituição, devolução ou crédito ao segurado:
   - amountDirection = "refund"
   - amount deve ser NEGATIVO.

   Exemplo:
   R$ 125,40 a restituir
   =>
   "amount": -125.40

10. Se o documento afirmar explicitamente que não existe cobrança nem
    restituição:
    - amountDirection = "neutral"
    - amount = 0

11. Se não for possível determinar o valor com segurança:
    - amount = null
    - amountDirection = null

Nunca use 0 apenas porque o valor não foi encontrado.

EVIDÊNCIA DO VALOR

Para todo tipo que possuir "amount", também retorne:

- "amountLabel":
  o nome/rótulo associado ao valor escolhido no documento.
  Exemplo: "Preço Total", "Prêmio do Endosso", "Valor a Restituir".
  Se não houver um rótulo identificável, use null.

- "amountEvidence":
  um trecho curto do próprio documento que justifique o valor escolhido.
  Não explique seu raciocínio.
  Apenas transcreva o menor trecho suficiente para identificar o valor.

Exemplo:

Documento:
"Preço Líquido R$ 36,57"
"IOF R$ 2,70"
"Preço Total (impostos inclusos) R$ 39,27"

Resultado:

"amount": 39.27
"amountDirection": "charge"
"amountLabel": "Preço Total (impostos inclusos)"
"amountEvidence": "Preço Total (impostos inclusos) R$ 39,27"

Outro exemplo:

Documento:
"Prêmio a restituir ao segurado: R$ 150,00"

Resultado:

"amount": -150
"amountDirection": "refund"
"amountLabel": "Prêmio a restituir ao segurado"
"amountEvidence": "Prêmio a restituir ao segurado: R$ 150,00"

PERCENTUAL DE COMISSÃO

"percentage" representa exclusivamente o percentual de comissão referente
ao endosso.

- Retorne somente o número.
- Exemplo: 15% => 15
- Não confunda com percentual FIPE, desconto, franquia, bônus ou outro
  percentual.
- Se não estiver informado, use null.

FRANQUIA

"franchise" representa a franquia principal do seguro/casco.

Não confunda com:
- franquia de vidro;
- franquia de para-brisa;
- franquia de farol;
- franquia de lanterna;
- franquia de retrovisor;
- franquia de assistência;
- valores de participação de serviços específicos.

Se houver uma franquia principal/compreensiva/casco e diversas franquias
de serviços, utilize a franquia principal.

FORMATO POR TIPO

vehicle_conductor:

{
  "type": "vehicle_conductor",
  "lookup": {
    "plate": "string ou null",
    "insuredRegistration": "string ou null",
    "insuredName": "string ou null"
  },
  "data": {
    "driver": "string",
    "plate": "string ou null",
    "model": "string",
    "modelYear": "string ou number ou null",
    "franchise": "number",
    "amount": "number ou null",
    "percentage": "number ou null",
    "amountDirection": "charge, refund, neutral ou null",
    "amountEvidence": "string ou null",
    "amountLabel": "string ou null"
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
    "postalCode": "string",
    "amount": "number ou null",
    "percentage": "number ou null",
    "amountDirection": "charge, refund, neutral ou null",
    "amountEvidence": "string ou null",
    "amountLabel": "string ou null"
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
    "franchise": "number",
    "amount": "number ou null",
    "percentage": "number ou null",
    "amountDirection": "charge, refund, neutral ou null",
    "amountEvidence": "string ou null",
    "amountLabel": "string ou null"
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
    "effectivedAt": "DD/MM/AAAA"
  }
}

REGRAS GERAIS

- Responda APENAS com JSON.
- Responda em uma única linha minificada.
- Não utilize markdown.
- Não utilize \`\`\`.
- Não adicione comentários.
- Não adicione campos diferentes dos especificados.
- Todo campo "number" deve ser JSON number, nunca string.
- Converta valores brasileiros corretamente:
  R$ 1.234,56 => 1234.56
  R$ 39,27 => 39.27
- Cada campo deve conter somente um dado.
- Nunca retorne dois valores separados por vírgula, "/", "ou" etc.
- Não invente informações ausentes.
- Utilize null somente nos campos que permitem null.
- Analise o documento inteiro antes de escolher valores.
- Quando texto e imagem parecerem conflitantes por causa da extração do PDF,
  utilize o contexto visual da página para determinar a associação correta.

Texto extraído do documento:

"""
${text}
"""
`;
}

async function extractDataEndorsement(path: ArrayBuffer) {
	return await runPdfExtraction({
		label: 'extract-endorsement',
		buffer: path,
		ask: async ({ model, text, images }) =>
			SchemaDataExtractEndorsement.parse(
				await askJson({
					model,
					prompt: mountPrompt(text, images.length),
					images,
				}),
			),
	});
}

async function findSafeByLookup(
	database: Database,
	lookup: DataExtractEndorsement['lookup'],
): Promise<string | null> {
	if (!lookup.plate) {
		throw new Error(
			'Endosso sem placa da apólice atual, deve ser feito manualmente',
		);
	}

	const plateSanitized = lookup.plate.replace('-', '').toLowerCase();

	const insuredRegistrationSanitized = lookup.insuredRegistration
		? maskNumber(lookup.insuredRegistration)
		: null;

	const where: Prisma.SafeWhereInput = {
		safeVehicle: {
			OR: [
				{
					plate: plateSanitized,
				},
				{
					vehicle: {
						OR: [
							{
								plate: plateSanitized,
							},
							{
								plateAlternative: plateSanitized,
							},
						],
					},
				},
			],
		},
		...(insuredRegistrationSanitized && {
			insured: {
				OR: [
					{
						cpf: insuredRegistrationSanitized,
					},
					{
						cnpj: insuredRegistrationSanitized,
					},
				],
			},
		}),
	};

	// Prefere a proposta real: o produtor de teste (oculto na listagem) pode ter
	// a mesma placa/segurado, e o endosso não deve cair nele por engano.
	const safe =
		(await database.safe.findFirst({
			where: {
				...where,
				OR: [
					{ producerId: null },
					{ producerId: { not: EXCLUDED_PRODUCER_ID } },
				],
			},
			orderBy: { requestedAt: 'desc' },
		})) ?? (await database.safe.findFirst({ where }));

	return safe?.id ?? null;
}

/**
 * Remove metadados utilizados somente para validação/debug da extração
 * antes de devolver os dados para o consumidor da API.
 */
function sanitizeExtractedData(extracted: DataExtractEndorsement) {
	if (extracted.type === 'cancellation') {
		return extracted.data;
	}

	const {
		amountEvidence: _amountEvidence,
		amountLabel: _amountLabel,
		amountDirection: _amountDirection,
		...data
	} = extracted.data;

	return data;
}

function validateFinancialExtraction(extracted: DataExtractEndorsement): void {
	if (extracted.type === 'cancellation') {
		return;
	}

	const { amount, amountDirection, amountEvidence } = extracted.data;

	if (amount === null) {
		return;
	}

	if (amount > 0 && amountDirection !== 'charge') {
		throw new Error('Inconsistência na identificação do valor do endosso');
	}

	if (amount < 0 && amountDirection !== 'refund') {
		throw new Error(
			'Inconsistência na identificação da restituição do endosso',
		);
	}

	if (amount === 0 && amountDirection !== 'neutral') {
		throw new Error(
			'Inconsistência na identificação do valor neutro do endosso',
		);
	}

	if (!amountEvidence) {
		throw new Error('Não foi possível confirmar a origem do valor do endosso');
	}
}

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
				 * Incrementar a versão sempre que houver alteração relevante
				 * na estratégia/schema de extração.
				 */
				const cacheKey = `endorsement-pdf-extract:v4:${hash}`;

				const cached = await ctx.cache.get(cacheKey);

				const extracted = cached
					? SchemaDataExtractEndorsement.parse(JSON.parse(cached))
					: await extractDataEndorsement(buffer);

				validateFinancialExtraction(extracted);

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
					throw new Error('Não foi encontrada apólice referente ao endosso');
				}

				return ctx.json(
					{
						safeId,
						type: extracted.type,
						data: sanitizeExtractedData(extracted),
					},
					200,
				);
			} catch (error) {
				let message = 'Falha ao extrair dados do documento';

				if (error instanceof Error) {
					message = error.message;
				}

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
