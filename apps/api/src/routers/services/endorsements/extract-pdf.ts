import { zValidator } from '@hono/zod-validator';
import {
	maskNumber,
	SchemaCPF,
	SchemaCPFOrCNPJ,
	SchemaDateString,
	SchemaPostalCode,
} from '@segwise/core';
import { z } from 'zod';
import type { Database } from '@/@types/database';
import type { Server } from '@/@types/server';
import {
	AIProviderError,
	askJson,
	runPdfExtraction,
	SchemaPlateLenient,
	visionInstructions,
} from '@/libraries/ai/pdf-extraction';

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

function franchiseEvidenceLooksPrincipal(evidence: string): boolean {
	const normalized = normalizeText(evidence);

	return /\b(casco|compreensiva|basica|obrigatoria|participacao obrigatoria|indenizacao parcial do veiculo|franquia do veiculo|veiculo)\b/.test(
		normalized,
	);
}

function typeEvidenceMatches(
	type: 'vehicle_conductor' | 'address' | 'franchise' | 'cancellation',
	evidence: string,
): boolean {
	const normalized = normalizeText(evidence);

	switch (type) {
		case 'vehicle_conductor':
			return /substituicao de veiculo|alteracao de veiculo|troca de veiculo|principal condutor|alteracao de condutor|substituicao de condutor/.test(
				normalized,
			);
		case 'address':
			return /alteracao.*(endereco|cep|pernoite|local de risco)|(endereco|cep|pernoite|local de risco).*alteracao/.test(
				normalized,
			);
		case 'franchise':
			return /alteracao.*franquia|franquia.*alteracao/.test(normalized);
		case 'cancellation':
			return /cancelamento|rescisao|encerramento/.test(normalized);
	}
}

function sum(values: number[]): number {
	return values.reduce((total, value) => total + value, 0);
}

function assertClose(actual: number, expected: number, message: string): void {
	if (Math.abs(actual - expected) > MONEY_TOLERANCE) {
		throw new Error(message);
	}
}

const SchemaLookup = z
	.object({
		plate: SchemaPlateLenient,
		insuredRegistration: SchemaCPFOrCNPJ.nullable(),
		insuredName: z.string().trim().min(1).nullable(),
	})
	.strict();

const SchemaPercentage = z
	.number('Percentual de comissão inválido')
	.min(0, 'Percentual de comissão inválido')
	.max(100, 'Percentual de comissão inválido')
	.nullable();

const SchemaDataExtractVehicleConductor = z
	.object({
		type: z.literal('vehicle_conductor'),
		lookup: SchemaLookup,
		data: z
			.object({
				driver: SchemaCPF.nullable(),
				plate: SchemaPlateLenient,
				model: z.string('Modelo do veículo inválido').trim().min(1).nullable(),
				modelYear: z
					.number('Ano do modelo inválido')
					.int('Ano do modelo inválido')
					.min(1900)
					.max(2100)
					.nullable(),
				franchise: z
					.number('Valor da franquia inválido')
					.positive('Valor da franquia inválido')
					.nullable(),
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
					.number('Valor da franquia inválido')
					.positive('Valor da franquia inválido'),
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

const SchemaModelMoneyNullable = z.preprocess(
	parseBrazilianNumber,
	z.number().finite().nullable(),
);

const SchemaModelPercentageNullable = z.preprocess(
	parseBrazilianNumber,
	z.number().finite().min(0).max(100).nullable(),
);

const SchemaModelIntegerNullable = z.preprocess(
	parseInteger,
	z.number().int().nullable(),
);

const SchemaModelLookup = z
	.object({
		plate: z.string().nullable(),
		insuredRegistration: z.string().nullable(),
		insuredName: z.string().nullable(),
		evidence: z.string().nullable(),
	})
	.strict();

const SchemaModelFinancial = z
	.object({
		amount: SchemaModelMoneyNullable,
		amountDirection: z.enum(['charge', 'refund', 'neutral']).nullable(),
		amountEvidence: z.string().nullable(),
		nonLiquidCharges: z.array(
			z.preprocess(parseBrazilianNumber, z.number().finite().nonnegative()),
		),
		finalTotal: SchemaModelMoneyNullable,
		financialEvidence: z.string().nullable(),
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
				changeKind: z.enum([
					'vehicle',
					'driver',
					'vehicle_and_driver',
					'unknown',
				]),
				driver: z.string().nullable(),
				plate: z.string().nullable(),
				plateStatus: z.enum(['present', 'explicitly_absent', 'unknown']),
				plateEvidence: z.string().nullable(),
				model: z.string().nullable(),
				modelYear: SchemaModelIntegerNullable,
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
				reason: z.string().min(1),
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

function mountPrompt(text: string, imagesCount: number): string {
	return `
Extraia os dados do ENDOSSO DE SEGURO deste PDF.
O layout pode ser de qualquer seguradora e o título do documento nem sempre contém a palavra "endosso". A finalidade real da operação é o que determina o tipo.

${visionInstructions(imagesCount)}

PRINCÍPIO DE SEGURANÇA
- Nunca invente.
- Se não houver evidência suficiente, use null, "unknown" ou "unknown" em changeKind para que o sistema rejeite a extração.
- Analise todas as páginas.
- Use a imagem para resolver colunas/tabelas e o texto para caracteres exatos.

TIPO DO ENDOSSO
Retorne exatamente um:
- vehicle_conductor: substituição/alteração de veículo, placa, modelo ou principal condutor;
- address: alteração de endereço, CEP de pernoite ou local de risco;
- franchise: somente quando a finalidade principal for ALTERAR A FRANQUIA;
- cancellation: cancelamento/rescisão/encerramento;
- unknown: qualquer outro tipo ou quando não for possível classificar com segurança.

A simples presença de uma franquia no documento NÃO torna o endosso do tipo franchise.
"typeEvidence" deve ser um trecho curto que prove a finalidade.

LOOKUP DO SEGURO
- insuredRegistration = CPF/CNPJ do SEGURADO, nunca do condutor, corretor ou titular do cartão;
- insuredName = nome do SEGURADO;
- lookup.plate = placa ANTERIOR somente quando o documento a identificar claramente como anterior/substituída/atual antes da mudança;
- em substituição, se só houver a placa nova e não houver certeza da placa anterior, use lookup.plate=null;
- lookup.evidence deve provar CPF/CNPJ/nome do segurado e, quando usada, a placa anterior.

VEÍCULO / CONDUTOR
Para vehicle_conductor:
- changeKind=vehicle quando muda apenas veículo;
- driver quando muda apenas principal condutor;
- vehicle_and_driver quando ambos mudam;
- unknown se não for possível saber.

Quando houver mudança de veículo, retorne os dados RESULTANTES após o endosso:
- data.plate = nova placa;
- data.model = novo modelo;
- data.modelYear = ano modelo;
- data.franchise = franquia PRINCIPAL resultante do veículo;
- data.plateStatus="explicitly_absent" somente se o PDF mostrar claramente "-", "A AVISAR", "SEM PLACA" ou equivalente; se não localizou a placa, use "unknown".

FRANQUIA PRINCIPAL
Aceite casco/compreensiva/básica/obrigatória/participação obrigatória/25% da normal/50% da obrigatória ou equivalente.
Nunca use franquias de vidro, para-brisa, farol, lanterna, retrovisor, roda, pneu ou assistência.
"franchiseEvidence" deve conter o rótulo da cobertura/franquia principal e o valor.

VALOR FINANCEIRO DO ENDOSSO
"amount" = valor LÍQUIDO da negociação do endosso, ANTES de IOF, juros, encargos ou custos.
Rótulos válidos incluem "Prêmio Líquido", "Prêmio Líquido Total", "Preço Líquido", "Valor Líquido" e equivalentes.

NUNCA use como amount o total final com IOF/juros.
Exemplos:
- Prêmio Líquido Total 374,29 + IOF 27,62 + Prêmio Total 401,91 => amount=374.29;
- Preço Líquido 36,57 + IOF 2,70 + Preço Total 39,27 => amount=36.57;
- Prêmio Líquido 833,71 + IOF 61,52 + Prêmio Total 895,23 => amount=833.71.

DIREÇÃO FINANCEIRA
- charge: segurado deve pagar; valor final interno será positivo;
- refund: segurado recebe crédito/restituição/estorno; valor final interno será negativo;
- neutral: somente quando o documento explicitar ausência de movimentação e amount=0.
Se o próprio documento trouxer Preço Líquido negativo, preserve a natureza de restituição: amountDirection=refund.

"amountEvidence" deve provar o valor LÍQUIDO escolhido.
"nonLiquidCharges" = IOF, juros, encargos e custos adicionados ao líquido para chegar ao total final; não inclua zeros.
"finalTotal" = total final com tributos/encargos, somente para conferência.
"financialEvidence" deve trazer os trechos curtos usados para conferir líquido + encargos + total.

COMISSÃO
"percentage" é EXCLUSIVAMENTE percentual de comissão do corretor.
Nunca confunda com FIPE, fator de ajuste, desconto, bônus, participação ou percentual de franquia.
Sem comissão explícita => null.
"percentageEvidence" deve provar o percentual quando preenchido.

CANCELAMENTO
Para cancellation, retorne apenas a data de efetivação do cancelamento em effectivedAt. Não invente data a partir de vigência se não estiver claro.

FORMATO DE SAÍDA
Retorne apenas um JSON minificado compatível com um destes formatos.

vehicle_conductor:
{"type":"vehicle_conductor","typeEvidence":"string|null","lookup":{"plate":"string|null","insuredRegistration":"string|null","insuredName":"string|null","evidence":"string|null"},"data":{"changeKind":"vehicle|driver|vehicle_and_driver|unknown","driver":"CPF|null","plate":"string|null","plateStatus":"present|explicitly_absent|unknown","plateEvidence":"string|null","model":"string|null","modelYear":2026,"franchise":1234.56,"franchiseEvidence":"string|null","amount":100.25,"amountDirection":"charge|refund|neutral|null","amountEvidence":"string|null","nonLiquidCharges":[7.39],"finalTotal":107.64,"financialEvidence":"string|null","percentage":null,"percentageEvidence":null}}

address:
{"type":"address","typeEvidence":"string|null","lookup":{"plate":"string|null","insuredRegistration":"string|null","insuredName":"string|null","evidence":"string|null"},"data":{"postalCode":"string|null","amount":100.25,"amountDirection":"charge|refund|neutral|null","amountEvidence":"string|null","nonLiquidCharges":[7.39],"finalTotal":107.64,"financialEvidence":"string|null","percentage":null,"percentageEvidence":null}}

franchise:
{"type":"franchise","typeEvidence":"string|null","lookup":{"plate":"string|null","insuredRegistration":"string|null","insuredName":"string|null","evidence":"string|null"},"data":{"franchise":1234.56,"franchiseEvidence":"string|null","amount":100.25,"amountDirection":"charge|refund|neutral|null","amountEvidence":"string|null","nonLiquidCharges":[7.39],"finalTotal":107.64,"financialEvidence":"string|null","percentage":null,"percentageEvidence":null}}

cancellation:
{"type":"cancellation","typeEvidence":"string|null","lookup":{"plate":"string|null","insuredRegistration":"string|null","insuredName":"string|null","evidence":"string|null"},"data":{"effectivedAt":"DD/MM/AAAA|null"}}

unknown:
{"type":"unknown","typeEvidence":"string|null","lookup":{"plate":"string|null","insuredRegistration":"string|null","insuredName":"string|null","evidence":"string|null"},"data":{"reason":"string"}}

TEXTO EXTRAÍDO DO PDF
"""
${text}
"""
`;
}

function normalizeLookup(
	lookup: ModelOutput['lookup'],
	sourceText: string,
): z.infer<typeof SchemaLookup> {
	if (!lookup.insuredRegistration || !lookup.insuredName || !lookup.evidence) {
		throw new Error('Segurado do endosso não identificado com segurança');
	}

	const registrationConfirmed =
		evidenceContainsRegistration(lookup.evidence, lookup.insuredRegistration) ||
		sourceContainsRegistrationNear(sourceText, lookup.insuredRegistration, [
			'dados do segurado',
			'dados do proponente',
			'proponente',
			'segurado',
			'nome do segurado',
			'cpf cnpj',
		]);

	if (!registrationConfirmed) {
		throw new Error(
			'O documento não confirma o CPF/CNPJ do segurado do endosso',
		);
	}

	return SchemaLookup.parse({
		plate: SchemaPlateLenient.parse(lookup.plate),
		insuredRegistration: lookup.insuredRegistration,
		insuredName: lookup.insuredName,
	});
}

function normalizeFinancialData(data: z.infer<typeof SchemaModelFinancial>): {
	amount: number;
	percentage: number | null;
} {
	if (data.amount === null || !data.amountEvidence) {
		throw new Error(
			'Não foi possível determinar com segurança o valor líquido do endosso',
		);
	}

	if (!evidenceContainsValue(data.amountEvidence, data.amount)) {
		throw new Error('A evidência não confirma o valor líquido do endosso');
	}

	let direction = data.amountDirection;

	if (!direction) {
		if (data.amount < 0) {
			direction = 'refund';
		} else if (data.amount > 0) {
			direction = 'charge';
		} else {
			throw new Error('Valor zero sem indicação explícita de neutralidade');
		}
	}

	const evidence = normalizeText(
		`${data.amountEvidence} ${data.financialEvidence ?? ''}`,
	);

	let amount: number;

	switch (direction) {
		case 'charge': {
			if (data.amount < 0) {
				throw new Error(
					'Endosso marcado como cobrança com valor líquido negativo',
				);
			}

			amount = Math.abs(data.amount);
			break;
		}

		case 'refund': {
			const hasRefundSignal =
				data.amount < 0 ||
				/restituicao|credito|estorno|devolucao|a restituir/.test(evidence);

			if (!hasRefundSignal) {
				throw new Error(
					'Endosso marcado como restituição sem evidência suficiente de crédito/restituição',
				);
			}

			amount = -Math.abs(data.amount);
			break;
		}

		case 'neutral': {
			if (Math.abs(data.amount) > 0.01) {
				throw new Error(
					'Endosso neutro possui valor financeiro diferente de zero',
				);
			}

			if (
				!/sem.*(cobranca|movimentacao|premio)|sem premio|sem movimento/.test(
					evidence,
				)
			) {
				throw new Error('Endosso neutro sem evidência explícita de valor zero');
			}

			amount = 0;
			break;
		}
	}

	if (data.finalTotal !== null) {
		if (!data.financialEvidence) {
			throw new Error('Total do endosso identificado sem evidência');
		}

		if (!evidenceContainsValue(data.financialEvidence, data.finalTotal)) {
			throw new Error('A evidência não confirma o total final do endosso');
		}

		for (const charge of data.nonLiquidCharges) {
			if (!evidenceContainsValue(data.financialEvidence, charge)) {
				throw new Error('A evidência não confirma os encargos do endosso');
			}
		}

		assertClose(
			Math.abs(data.amount) + sum(data.nonLiquidCharges),
			Math.abs(data.finalTotal),
			'Valor líquido, encargos e total final do endosso são inconsistentes',
		);
	}

	let percentage = data.percentage;

	if (percentage !== null) {
		if (
			!data.percentageEvidence ||
			!evidenceContainsValue(data.percentageEvidence, percentage, 0.001) ||
			!/comiss/.test(normalizeText(data.percentageEvidence))
		) {
			percentage = null;
		}
	}

	return { amount, percentage };
}

function validateTypeEvidence(
	type: 'vehicle_conductor' | 'address' | 'franchise' | 'cancellation',
	evidence: string | null,
): void {
	if (!evidence || !typeEvidenceMatches(type, evidence)) {
		throw new Error(
			`Tipo de endosso ${type} identificado sem evidência suficiente`,
		);
	}
}

function normalizeResultingPlate(
	plate: string | null,
	status: 'present' | 'explicitly_absent' | 'unknown',
	evidence: string | null,
): string | null {
	if (status === 'present') {
		const normalized = SchemaPlateLenient.parse(plate);

		if (!normalized || !evidence) {
			throw new Error('Nova placa do endosso não pôde ser confirmada');
		}

		const compactEvidence = evidence.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

		if (!compactEvidence.includes(normalized)) {
			throw new Error('A evidência não confirma a nova placa do endosso');
		}

		return normalized;
	}

	if (status === 'explicitly_absent') {
		if (!evidence) {
			throw new Error('Ausência de nova placa informada sem evidência');
		}

		return null;
	}

	throw new Error('Não foi possível determinar a nova placa com segurança');
}

function finalizeModelOutput(
	raw: ModelOutput,
	sourceText: string,
): DataExtractEndorsement {
	if (raw.type === 'unknown') {
		throw new Error(
			`Tipo de endosso não suportado ou não identificado com segurança: ${raw.data.reason}`,
		);
	}

	validateTypeEvidence(raw.type, raw.typeEvidence);
	const lookup = normalizeLookup(raw.lookup, sourceText);

	switch (raw.type) {
		case 'vehicle_conductor': {
			if (raw.data.changeKind === 'unknown') {
				throw new Error(
					'Alteração de veículo/condutor não identificada com segurança',
				);
			}

			const financial = normalizeFinancialData(raw.data);
			const changesVehicle =
				raw.data.changeKind === 'vehicle' ||
				raw.data.changeKind === 'vehicle_and_driver';
			const changesDriver =
				raw.data.changeKind === 'driver' ||
				raw.data.changeKind === 'vehicle_and_driver';

			let plate: string | null = null;
			let model: string | null = null;
			let modelYear: number | null = null;
			let franchise: number | null = null;

			if (changesVehicle) {
				plate = normalizeResultingPlate(
					raw.data.plate,
					raw.data.plateStatus,
					raw.data.plateEvidence,
				);

				if (
					!raw.data.model ||
					raw.data.modelYear === null ||
					raw.data.franchise === null ||
					raw.data.franchise <= 0 ||
					!raw.data.franchiseEvidence
				) {
					throw new Error(
						'Substituição de veículo sem modelo, ano ou franquia principal confirmados',
					);
				}

				if (
					!evidenceContainsValue(raw.data.franchiseEvidence, raw.data.franchise)
				) {
					throw new Error(
						'A evidência não confirma a franquia principal resultante',
					);
				}

				if (!franchiseEvidenceLooksPrincipal(raw.data.franchiseEvidence)) {
					throw new Error(
						'A evidência não permite confirmar que a franquia seja a principal',
					);
				}

				model = raw.data.model;
				modelYear = raw.data.modelYear;
				franchise = raw.data.franchise;
			}

			let driver: string | null = null;

			if (changesDriver) {
				if (!raw.data.driver) {
					throw new Error(
						'Alteração de condutor sem CPF do novo principal condutor',
					);
				}

				driver = SchemaCPF.parse(raw.data.driver);
			} else if (raw.data.driver) {
				driver = SchemaCPF.parse(raw.data.driver);
			}

			return SchemaDataExtractVehicleConductor.parse({
				type: 'vehicle_conductor',
				lookup,
				data: {
					driver,
					plate,
					model,
					modelYear,
					franchise,
					amount: financial.amount,
					percentage: financial.percentage,
				},
			});
		}

		case 'address': {
			if (!raw.data.postalCode) {
				throw new Error('Endosso de endereço sem novo CEP confirmado');
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
			if (
				raw.data.franchise === null ||
				raw.data.franchise <= 0 ||
				!raw.data.franchiseEvidence
			) {
				throw new Error('Endosso de franquia sem novo valor confirmado');
			}

			if (
				!evidenceContainsValue(raw.data.franchiseEvidence, raw.data.franchise)
			) {
				throw new Error('A evidência não confirma a nova franquia');
			}

			if (!franchiseEvidenceLooksPrincipal(raw.data.franchiseEvidence)) {
				throw new Error(
					'A evidência não confirma que seja a franquia principal',
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
					'Endosso de cancelamento sem data de efetivação segura',
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

async function askModel({
	model,
	text,
	images,
}: {
	model: string;
	text: string;
	images: Array<string>;
}): Promise<DataExtractEndorsement> {
	const parsed = await askJson({
		model,
		prompt: mountPrompt(text, images.length),
		images,
	});

	const raw = SchemaModelOutput.parse(parsed);

	return finalizeModelOutput(raw, text);
}

async function extractDataEndorsement(path: ArrayBuffer) {
	return await runPdfExtraction({
		label: 'extract-endorsement',
		buffer: path,
		ask: askModel,
	});
}

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
						{ plate },
						{
							vehicle: {
								OR: [{ plate }, { plateAlternative: plate }],
							},
						},
					],
				},
				...(insuredRegistration && {
					insured: {
						OR: [{ cpf: insuredRegistration }, { cnpj: insuredRegistration }],
					},
				}),
			},
			select: { id: true },
		});

		if (safe) {
			return safe.id;
		}
	}

	if (insuredRegistration) {
		const candidates = await database.safe.findMany({
			where: {
				insured: {
					OR: [{ cpf: insuredRegistration }, { cnpj: insuredRegistration }],
				},
			},
			select: { id: true },
			take: 2,
		});

		if (candidates.length === 1) {
			return candidates[0]?.id ?? null;
		}
	}

	return null;
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
				const cacheKey = `endorsement-pdf-extract:v11:${hash}`;
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

				if (error instanceof AIProviderError) {
					return ctx.json({ message }, 503);
				}

				return ctx.json({ message }, 409);
			}
		},
	);
}

export { registerRoutersServicesEndorsementsExtractPDF };
