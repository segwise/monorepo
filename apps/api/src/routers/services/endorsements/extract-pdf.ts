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
const DOCUMENT_FINANCIAL_RECONCILIATION_TOLERANCE = 0.1;

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

type SupportedEndorsementModality = 'vehicle' | 'motorcycle';

type ResolvedEndorsementModality = {
	modality: SupportedEndorsementModality;
	evidence: string;
};

function sourceSupportedEndorsementModality(
	sourceText: string,
): ResolvedEndorsementModality | null {
	const lines = sourceText.split('\n');
	const specificCandidates: Array<
		ResolvedEndorsementModality & { score: number }
	> = [];
	const genericCandidates: Array<
		ResolvedEndorsementModality & { score: number }
	> = [];

	const motorcycleTerms =
		/\b(motocicleta|motocicletas|moto|motos|motoneta|motonetas|bicicleta motorizada|bicicletas motorizadas|side car|vespacar)\b/;
	const vehicleTerms =
		/\b(veiculos? de passeio|automovel particular|pick ups? leves?|pickup(?:s)? leves?|suv|furgao|van|utilitario|utilitario comercial leve)\b/;

	for (let index = 0; index < lines.length; index += 1) {
		const block = lines
			.slice(Math.max(0, index - 1), Math.min(lines.length, index + 6))
			.join(' ')
			.replace(/\s+/g, ' ')
			.trim();
		const normalizedBlock = normalizeText(block);
		const normalizedLine = normalizeText(lines[index] ?? '');

		if (!normalizedBlock) {
			continue;
		}

		const isSpecificVehicleContext =
			/\b(tipo do veiculo|categoria(?: de risco)?|marca modelo do veiculo|dados do veiculo segurado|veiculo)\b/.test(
				normalizedLine,
			);

		if (isSpecificVehicleContext && motorcycleTerms.test(normalizedBlock)) {
			specificCandidates.push({
				modality: 'motorcycle',
				evidence: block,
				score: 300,
			});
		}

		if (isSpecificVehicleContext && vehicleTerms.test(normalizedBlock)) {
			specificCandidates.push({
				modality: 'vehicle',
				evidence: block,
				score: 280,
			});
		}

		if (
			/\bramo\b/.test(normalizedLine) &&
			motorcycleTerms.test(normalizedBlock)
		) {
			specificCandidates.push({
				modality: 'motorcycle',
				evidence: block,
				score: 240,
			});
		}

		if (
			/\bramo\b/.test(normalizedLine) &&
			/\bautomovel\b/.test(normalizedBlock)
		) {
			genericCandidates.push({
				modality: 'vehicle',
				evidence: block,
				score: 50,
			});
		}
	}

	const candidates =
		specificCandidates.length > 0 ? specificCandidates : genericCandidates;

	if (candidates.length === 0) {
		return null;
	}

	candidates.sort((a, b) => b.score - a.score);
	const best = candidates[0];

	if (!best) {
		return null;
	}

	const conflicting = candidates.find(
		(candidate) =>
			candidate.modality !== best.modality && candidate.score >= best.score - 5,
	);

	if (conflicting) {
		return null;
	}

	return { modality: best.modality, evidence: best.evidence };
}

function sourceExplicitlyUnsupportedEndorsementModality(
	sourceText: string,
): string | null {
	const lines = sourceText.split('\n');

	for (let index = 0; index < lines.length; index += 1) {
		const normalizedLine = normalizeText(lines[index] ?? '');

		if (
			!/\b(ramo|tipo do veiculo|categoria(?: de risco)?|marca modelo do veiculo|veiculo)\b/.test(
				normalizedLine,
			)
		) {
			continue;
		}

		const block = lines
			.slice(Math.max(0, index - 1), Math.min(lines.length, index + 6))
			.join(' ')
			.replace(/\s+/g, ' ')
			.trim();
		const normalizedBlock = normalizeText(block);

		if (
			/\b(caminhao|caminhoes|cavalo mecanico|semi reboque|semirreboque|carreta|trator rodoviario|onibus|micro onibus)\b/.test(
				normalizedBlock,
			)
		) {
			return block;
		}
	}

	return null;
}

function resolveSupportedEndorsementModality(
	modelModality: 'vehicle' | 'motorcycle' | 'unsupported' | 'unknown',
	modelEvidence: string | null,
	sourceText: string,
): ResolvedEndorsementModality | null {
	const sourceResolved = sourceSupportedEndorsementModality(sourceText);

	if (sourceResolved) {
		return sourceResolved;
	}

	if (
		(modelModality === 'vehicle' || modelModality === 'motorcycle') &&
		modelEvidence
	) {
		return { modality: modelModality, evidence: modelEvidence };
	}

	return null;
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

function uniquePostalCodesFromText(text: string): Array<string> {
	const matches = text.match(/\b\d{5}-?\d{3}\b/g) ?? [];
	const values = new Set<string>();

	for (const match of matches) {
		const parsed = SchemaPostalCode.safeParse(digitsOnly(match));

		if (parsed.success) {
			values.add(parsed.data);
		}
	}

	return [...values];
}

function fiveDigitPostalPrefixes(text: string): Array<string> {
	return [...new Set(text.match(/\b\d{5}\b/g) ?? [])];
}

function endorsementPostalContextBlocks(sourceText: string): Array<string> {
	const lines = sourceText.split('\n');
	const blocks: Array<string> = [];

	for (let index = 0; index < lines.length; index += 1) {
		const normalizedLine = normalizeText(lines[index] ?? '');

		if (
			!normalizedLine.includes('cep pernoite') &&
			!normalizedLine.includes('cep de pernoite') &&
			!normalizedLine.includes('cep onde pernoita') &&
			!normalizedLine.includes('local de risco') &&
			!normalizedLine.includes('endereco de risco') &&
			!normalizedLine.includes('novo cep') &&
			!normalizedLine.includes('cep novo') &&
			!normalizedLine.includes('novo endereco') &&
			!normalizedLine.includes('alteracao de endereco') &&
			!normalizedLine.includes('alteracao do endereco')
		) {
			continue;
		}

		const start = Math.max(0, index - 2);
		const end = Math.min(lines.length, index + 9);
		blocks.push(lines.slice(start, end).join('\n'));
	}

	return blocks;
}

function resolveEndorsementPostalCode(
	rawValue: string | null,
	sourceText: string,
): string {
	if (rawValue) {
		const direct = SchemaPostalCode.safeParse(digitsOnly(rawValue));

		if (direct.success) {
			return direct.data;
		}
	}

	const allFullPostalCodes = uniquePostalCodesFromText(sourceText);
	const contextBlocks = endorsementPostalContextBlocks(sourceText);
	const rawPrefixes = new Set<string>();
	const contextPrefixes = new Set<string>();

	if (rawValue) {
		for (const prefix of fiveDigitPostalPrefixes(rawValue)) {
			rawPrefixes.add(prefix);
		}

		const compactRaw = digitsOnly(rawValue);

		if (compactRaw.length === 5) {
			rawPrefixes.add(compactRaw);
		}
	}

	// Se a IA trouxe um prefixo de 5 dígitos para o NOVO CEP, ele é a evidência
	// mais específica. Primeiro tentamos encontrar no documento um único CEP
	// completo que comece por esse prefixo.
	if (rawPrefixes.size === 1) {
		const [prefix] = rawPrefixes;

		if (prefix) {
			const compatible = allFullPostalCodes.filter((candidate) =>
				digitsOnly(candidate).startsWith(prefix),
			);

			if (compatible.length === 1) {
				return compatible[0] as string;
			}

			if (compatible.length > 1) {
				throw new Error(
					'Novo CEP do endosso aparece apenas parcialmente e corresponde a mais de um CEP completo no documento',
				);
			}

			// Não existe CEP completo compatível em nenhum outro ponto do PDF.
			// Preservamos a região postal preenchendo zeros somente à direita.
			// Ex.: 50630 -> 50630000.
			const regionalPostalCode = SchemaPostalCode.safeParse(
				prefix.padEnd(8, '0'),
			);

			if (regionalPostalCode.success) {
				return regionalPostalCode.data;
			}
		}
	}

	if (rawPrefixes.size > 1) {
		throw new Error(
			'Novo CEP do endosso aparece apenas parcialmente e há mais de um prefixo regional possível',
		);
	}

	// Fallback para quando a IA não conseguiu retornar o CEP, mas o documento
	// contém o novo endereço/CEP em contexto forte de alteração.
	const contextFullCodes = new Set<string>();

	for (const block of contextBlocks) {
		for (const postalCode of uniquePostalCodesFromText(block)) {
			contextFullCodes.add(postalCode);
		}

		for (const prefix of fiveDigitPostalPrefixes(block)) {
			contextPrefixes.add(prefix);
		}
	}

	if (contextFullCodes.size === 1) {
		const [postalCode] = contextFullCodes;

		if (postalCode) {
			return postalCode;
		}
	}

	if (contextFullCodes.size > 1) {
		throw new Error(
			'Há mais de um CEP completo possível no contexto da alteração de endereço',
		);
	}

	if (contextPrefixes.size === 1) {
		const [prefix] = contextPrefixes;

		if (prefix) {
			const compatible = allFullPostalCodes.filter((candidate) =>
				digitsOnly(candidate).startsWith(prefix),
			);

			if (compatible.length === 1) {
				return compatible[0] as string;
			}

			if (compatible.length > 1) {
				throw new Error(
					'Novo CEP do endosso aparece apenas parcialmente e corresponde a mais de um CEP completo no documento',
				);
			}

			const regionalPostalCode = SchemaPostalCode.safeParse(
				prefix.padEnd(8, '0'),
			);

			if (regionalPostalCode.success) {
				return regionalPostalCode.data;
			}
		}
	}

	if (contextPrefixes.size > 1) {
		throw new Error(
			'Há mais de um prefixo de CEP possível no contexto da alteração de endereço',
		);
	}

	throw new Error('Endosso de endereço sem novo CEP confirmado');
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

function parseCpfCandidate(value: string): string | null {
	const direct = SchemaCPF.safeParse(value);

	if (direct.success) {
		return direct.data;
	}

	const digits = digitsOnly(value);
	const normalized = SchemaCPF.safeParse(digits);

	return normalized.success ? normalized.data : null;
}

function cpfCandidatesFromText(text: string): Array<string> {
	const matches =
		text.match(/\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/g) ?? [];

	return [
		...new Set(
			matches
				.map((candidate) => parseCpfCandidate(candidate))
				.filter((candidate): candidate is string => candidate !== null),
		),
	];
}

function sourceUsesSuhaiProponentProfileAsPrincipalDriver(
	sourceText: string,
	insuredRegistration: string | null,
): boolean {
	const expected = insuredRegistration ? digitsOnly(insuredRegistration) : '';

	if (!expected) {
		return false;
	}

	const normalized = normalizeText(sourceText);

	const isSuhai =
		normalized.includes('suhai seguradora') ||
		/\bproduto\s+suhai\b/.test(normalized);

	if (!isSuhai) {
		return false;
	}

	const lines = sourceText.split('\n');
	let proponentBlock = '';

	for (let index = 0; index < lines.length; index += 1) {
		if (!normalizeText(lines[index] ?? '').includes('dados do proponente')) {
			continue;
		}

		proponentBlock = lines
			.slice(index, Math.min(lines.length, index + 35))
			.join(' ');

		break;
	}

	const normalizedProponentBlock = normalizeText(proponentBlock);

	const hasProponentSection = Boolean(proponentBlock);
	const hasProfileSection = normalized.includes('dados do perfil');
	const hasNaturalPerson =
		normalizedProponentBlock.includes('fisica') ||
		/\btipo pessoa\s+fisica\b/.test(normalized);
	const proponentConfirmsInsured =
		digitsOnly(proponentBlock).includes(expected);

	const hasExplicitDriverSection =
		/\bprincipal condutor\b|\bcondutor principal\b|\bnome do principal condutor\b|\bcpf condutor\b|\binformacoes do condutor principal\b/.test(
			normalized,
		);

	return (
		hasProponentSection &&
		hasProfileSection &&
		hasNaturalPerson &&
		proponentConfirmsInsured &&
		!hasExplicitDriverSection
	);
}

function sourceMarksPrincipalDriverAsInsured(sourceText: string): boolean {
	const lines = sourceText.split('\n');

	for (let index = 0; index < lines.length; index += 1) {
		const normalizedLine = normalizeText(lines[index] ?? '');

		if (
			!normalizedLine.includes('principal condutor') &&
			!normalizedLine.includes('condutor principal')
		) {
			continue;
		}

		const start = Math.max(0, index - 1);
		const end = Math.min(lines.length, index + 3);
		const block = normalizeText(lines.slice(start, end).join(' '));

		if (
			/\bproprio segurado\b|\bo proprio segurado\b|\bmesmo segurado\b|\bproprio proponente\b|\bo proprio proponente\b/.test(
				block,
			) ||
			/\bsegurado e o principal condutor\b.{0,40}\bsim\b/.test(block)
		) {
			return true;
		}
	}

	return false;
}

function sourceConfirmsPrincipalDriverRegistration(
	sourceText: string,
	registration: string,
): boolean {
	const expected = digitsOnly(registration);

	if (!expected) {
		return false;
	}

	const lines = sourceText.split('\n');

	for (let index = 0; index < lines.length; index += 1) {
		const normalizedLine = normalizeText(lines[index] ?? '');
		const strongDriverLabel =
			normalizedLine.includes('principal condutor') ||
			normalizedLine.includes('condutor principal') ||
			normalizedLine.includes('nome do principal condutor') ||
			normalizedLine.includes('cpf condutor') ||
			normalizedLine.includes('informacoes do condutor principal') ||
			/\bcondutor\b.*\b(?:nascimento|cpf)\b/.test(normalizedLine) ||
			/\b(?:nascimento|cpf)\b.*\bcondutor\b/.test(normalizedLine) ||
			normalizedLine === 'condutor';

		if (!strongDriverLabel) {
			continue;
		}

		const start = Math.max(0, index - 3);
		const end = Math.min(lines.length, index + 5);
		const block = lines.slice(start, end).join(' ');

		if (digitsOnly(block).includes(expected)) {
			return true;
		}
	}

	return sourceContainsRegistrationNear(sourceText, registration, [
		'questionario de avaliacao de risco',
		'dados do perfil',
	]);
}

function sourcePrincipalDriverCpf(sourceText: string): string | null {
	const lines = sourceText.split('\n');
	const candidates = new Set<string>();

	for (let index = 0; index < lines.length; index += 1) {
		const normalizedLine = normalizeText(lines[index] ?? '');
		const strongDriverLabel =
			normalizedLine.includes('principal condutor') ||
			normalizedLine.includes('condutor principal') ||
			normalizedLine.includes('nome do principal condutor') ||
			normalizedLine.includes('cpf condutor') ||
			normalizedLine.includes('informacoes do condutor principal') ||
			/\bcondutor\b.*\b(?:nascimento|cpf)\b/.test(normalizedLine) ||
			/\b(?:nascimento|cpf)\b.*\bcondutor\b/.test(normalizedLine) ||
			normalizedLine === 'condutor';

		if (!strongDriverLabel) {
			continue;
		}

		const start = Math.max(0, index - 3);
		const end = Math.min(lines.length, index + 5);
		const block = lines.slice(start, end).join(' ');

		const labelled = block.match(
			/(?:cpf\s*(?:do\s*)?(?:principal\s*)?condutor|cpf\s*condutor)\s*:?\s*([0-9.\-\s]{11,18})/i,
		);

		if (labelled?.[1]) {
			const parsed = parseCpfCandidate(labelled[1]);

			if (parsed) {
				return parsed;
			}
		}

		for (const candidate of cpfCandidatesFromText(block)) {
			candidates.add(candidate);
		}
	}

	return candidates.size === 1 ? ([...candidates][0] ?? null) : null;
}

function resolvePrincipalDriverCpf({
	modelDriver,
	lookup,
	sourceText,
}: {
	modelDriver: string | null;
	lookup: z.infer<typeof SchemaLookup>;
	sourceText: string;
}): string | null {
	if (modelDriver) {
		const parsedModelDriver = parseCpfCandidate(modelDriver);

		if (
			parsedModelDriver &&
			(sourceConfirmsPrincipalDriverRegistration(
				sourceText,
				parsedModelDriver,
			) ||
				(sourceMarksPrincipalDriverAsInsured(sourceText) &&
					lookup.insuredRegistration !== null &&
					digitsOnly(parsedModelDriver) ===
						digitsOnly(lookup.insuredRegistration)))
		) {
			return parsedModelDriver;
		}
	}

	const fromDocument = sourcePrincipalDriverCpf(sourceText);

	if (fromDocument) {
		return fromDocument;
	}

	if (
		lookup.insuredRegistration &&
		(sourceMarksPrincipalDriverAsInsured(sourceText) ||
			sourceUsesSuhaiProponentProfileAsPrincipalDriver(
				sourceText,
				lookup.insuredRegistration,
			) ||
			sourceConfirmsPrincipalDriverRegistration(
				sourceText,
				lookup.insuredRegistration,
			))
	) {
		return parseCpfCandidate(lookup.insuredRegistration);
	}

	return null;
}

function sourceLooksLikeVehicleSubstitutionAdjustment(
	sourceText: string,
): boolean {
	const normalized = normalizeText(sourceText);

	const vehicleChanged =
		/\bveiculo igual ao anterior nao\b/.test(normalized) ||
		/\b(substituicao|troca|alteracao) de veiculo\b/.test(normalized);

	const hasNegativeLiquid =
		/(?:pre[cç]o|pr[eê]mio|valor)\s+l[ií]quido(?:\s+total)?\s*:?\s*R?\$?\s*-\s*\d/i.test(
			sourceText,
		);

	const hasCredit = /\bcredito em conta\b/.test(normalized);
	const hasPreviousPolicy =
		/\b(apolice anterior|seguradora anterior|fim da vigencia anterior)\b/.test(
			normalized,
		);

	return (
		vehicleChanged && hasPreviousPolicy && (hasNegativeLiquid || hasCredit)
	);
}

function sourceFinancialContext(sourceText: string): string {
	const lines = sourceText.split('\n');
	const blocks: string[] = [];

	for (let index = 0; index < lines.length; index += 1) {
		const normalizedLine = normalizeText(lines[index] ?? '');

		if (
			!/(preco liquido|premio liquido|valor liquido|forma de pagamento|informacoes de pagamento|parcelamento do premio|tipo de endosso|restituicao de premio|ordem de restituicao)/.test(
				normalizedLine,
			)
		) {
			continue;
		}

		blocks.push(
			lines
				.slice(Math.max(0, index - 2), Math.min(lines.length, index + 6))
				.join(' '),
		);
	}

	return blocks.join(' \n ');
}

function sourceFinancialDirection(
	sourceText: string,
	rawAmount: number,
	modelEvidence?: string | null,
): 'charge' | 'refund' | 'neutral' | null {
	if (rawAmount < -MONEY_TOLERANCE) {
		return 'refund';
	}

	const documentContext = normalizeText(sourceFinancialContext(sourceText));
	const modelContext = normalizeText(modelEvidence ?? '');
	const context = documentContext || modelContext;

	const explicitRefund =
		/forma de pagamento.{0,220}(restituicao de premio|credito em conta)/.test(
			context,
		) ||
		/tipo de endosso.{0,120}(restituicao|devolucao|estorno)/.test(context) ||
		/restituicao de premio/.test(context) ||
		/ordem de restituicao.{0,100}(?:valor )?\d/.test(context);

	if (explicitRefund) {
		return 'refund';
	}

	const explicitCharge =
		/tipo de endosso.{0,120}(cobranca|cobrar)/.test(context) ||
		/forma de pagamento.{0,260}(boleto|cartao de credito|debito em conta|pix)/.test(
			context,
		);

	if (rawAmount > MONEY_TOLERANCE) {
		// Um líquido positivo representa cobrança por padrão. Para transformá-lo em
		// restituição é necessária evidência financeira local e inequívoca; menções
		// genéricas a devolução/restituição em cláusulas do contrato não contam.
		return 'charge';
	}

	if (explicitCharge) {
		return 'charge';
	}

	const explicitNeutral =
		/sem (cobranca|movimentacao|premio)|sem premio|sem movimento/.test(context);

	return explicitNeutral ? 'neutral' : null;
}

function sourceLiquidAmount(
	sourceText: string,
): { value: number; evidence: string } | null {
	const lines = sourceText.split('\n');
	const candidates: Array<{ value: number; evidence: string }> = [];

	const pattern =
		/(?:pre[cç]o|pr[eê]mio|valor)\s+l[ií]quido(?:\s+total)?\s*:?\s*(?:R\$)?\s*(-?\s*\d{1,3}(?:\.\d{3})*(?:,\d{1,2})|-?\s*\d+(?:,\d{1,2})?)/i;

	for (let index = 0; index < lines.length; index += 1) {
		const block = lines
			.slice(index, Math.min(lines.length, index + 2))
			.join(' ');
		const match = block.match(pattern);

		if (!match?.[1]) {
			continue;
		}

		const parsed = parseBrazilianNumber(match[1].replace(/\s+/g, ''));

		if (typeof parsed === 'number' && Number.isFinite(parsed)) {
			candidates.push({ value: parsed, evidence: block.trim() });
		}
	}

	if (!candidates.length) {
		return null;
	}

	const unique = [
		...new Map(
			candidates.map((candidate) => [candidate.value.toFixed(2), candidate]),
		).values(),
	];

	return unique.length === 1 ? (unique[0] ?? null) : null;
}

function sourcePrincipalFranchise(
	sourceText: string,
): { value: number; evidence: string } | null {
	const explicitNoFranchise = sourceExplicitNoPrincipalFranchise(sourceText);

	if (explicitNoFranchise) {
		return { value: 0, evidence: explicitNoFranchise };
	}

	const lines = sourceText.split('\n');

	for (let index = 0; index < lines.length; index += 1) {
		const normalizedLine = normalizeText(lines[index] ?? '');

		if (
			!normalizedLine.includes('franquia participacao obrigatoria') &&
			!normalizedLine.includes('indenizacao parcial do veiculo')
		) {
			continue;
		}

		const block = lines
			.slice(index, Math.min(lines.length, index + 7))
			.join(' ');
		const normalizedBlock = normalizeText(block);

		if (
			!/\b(normal|obrigatoria|basica|reduzida|indenizacao parcial do veiculo)\b/.test(
				normalizedBlock,
			)
		) {
			continue;
		}

		const values = numericValuesFromText(block).filter((value) => value > 1);

		// Em tabelas como Allianz, o último valor monetário do pequeno bloco de
		// franquia principal é o valor da participação obrigatória. Percentuais
		// (25, 50 etc.) são descartados escolhendo o maior valor plausível.
		const plausible = values.filter((value) => value >= 100);

		if (plausible.length) {
			return { value: Math.max(...plausible), evidence: block.trim() };
		}
	}

	return null;
}

function compactAlphanumeric(value: string): string {
	return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function isExplicitPlateAbsenceValue(
	value: string | null | undefined,
): boolean {
	if (!value) {
		return false;
	}

	const trimmed = value.trim();

	if (/^[-–—]+$/.test(trimmed)) {
		return true;
	}

	const normalized = normalizeText(trimmed);

	return /^(a avisar|avisar|sem placa|s placa|splaca|nao possui placa|placa nao informada|nao informada)$/.test(
		normalized,
	);
}

function evidenceShowsExplicitPlateAbsence(
	evidence: string | null | undefined,
): boolean {
	if (!evidence) {
		return false;
	}

	if (isExplicitPlateAbsenceValue(evidence)) {
		return true;
	}

	const normalized = normalizeText(evidence);

	if (
		/\b(a avisar|avisar|sem placa|s placa|zero km sem placa|0 km sem placa|placa nao informada)\b/.test(
			normalized,
		)
	) {
		return true;
	}

	return /\bplaca\b\s*:?\s*[-–—]+(?:\s|$)/i.test(evidence);
}

function sourceShowsExplicitPlateAbsence(sourceText: string): boolean {
	const raw = sourceText.replace(/\r/g, '');

	if (
		/\bplaca\b\s*:?\s*(?:[-–—]+|a\s+avisar|avisar|sem\s+placa|s\/?\s*placa|placa\s+n[aã]o\s+informada)(?=\s|$)/im.test(
			raw,
		)
	) {
		return true;
	}

	if (/(?:^|\n)\s*[-–—]+\s*\n\s*placa\b/i.test(raw)) {
		return true;
	}

	const lines = raw.split('\n');

	for (let index = 0; index < lines.length; index += 1) {
		const normalizedLine = normalizeText(lines[index] ?? '');

		if (!normalizedLine.includes('placa')) {
			continue;
		}

		for (
			let previous = index - 1;
			previous >= Math.max(0, index - 3);
			previous -= 1
		) {
			const candidate = lines[previous]?.trim();

			if (!candidate) {
				continue;
			}

			if (isExplicitPlateAbsenceValue(candidate)) {
				return true;
			}

			break;
		}

		const block = lines
			.slice(Math.max(0, index - 1), Math.min(lines.length, index + 8))
			.join('\n');
		const normalizedBlock = normalizeText(block);

		if (
			/\b(a avisar|avisar|sem placa|s placa|zero km sem placa|0 km sem placa|placa nao informada|nao possui placa)\b/.test(
				normalizedBlock,
			) ||
			/\bplaca\b\s*:?\s*[-–—]+(?:\s|$)/i.test(block)
		) {
			return true;
		}

		const looksLikeVehicleTableHeader =
			normalizedLine.includes('chassi') ||
			normalizedLine.includes('veiculo') ||
			normalizedLine.includes('ano') ||
			normalizedLine.includes('fipe') ||
			normalizedLine.includes('zero km');

		if (looksLikeVehicleTableHeader) {
			for (const candidate of lines.slice(index + 1, index + 5)) {
				if (!candidate?.trim()) {
					continue;
				}

				if (/^\s*[-–—]+(?=\s|$)/.test(candidate)) {
					return true;
				}

				break;
			}
		}
	}

	const flattened = raw.replace(/\s+/g, ' ');

	return (
		/\bplaca\b(?=.{0,180}\bchassi\b).{0,320}?[-–—]\s+[A-Z0-9]{12,20}\b/i.test(
			flattened,
		) || /[-–—]\s+placa\s+[A-Z0-9]{12,20}\s+chassi\b/i.test(flattened)
	);
}

function sourceContainsPlateNear(sourceText: string, plate: string): boolean {
	const expected = plate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

	if (!expected) {
		return false;
	}

	const lines = sourceText.split('\n');

	for (let index = 0; index < lines.length; index += 1) {
		const normalizedLine = normalizeText(lines[index] ?? '');

		if (!normalizedLine.includes('placa')) {
			continue;
		}

		const block = lines
			.slice(Math.max(0, index - 1), Math.min(lines.length, index + 4))
			.join(' ')
			.replace(/[^a-zA-Z0-9]/g, '')
			.toLowerCase();

		if (block.includes(expected)) {
			return true;
		}
	}

	return false;
}

function franchiseEvidenceLooksPrincipal(evidence: string): boolean {
	const normalized = normalizeText(evidence);

	return /\b(casco|compreensiva|basica|obrigatoria|participacao obrigatoria|indenizacao parcial do veiculo|indenizacao integral|ind integral|roubo furto|colisao danos|franquia do veiculo|veiculo|normal|reduzida|facultativa)\b/.test(
		normalized,
	);
}

function evidenceExplicitlyStatesNoPrincipalFranchise(
	evidence: string | null | undefined,
): boolean {
	if (!evidence) {
		return false;
	}

	const normalized = normalizeText(evidence);

	return (
		/\b(nao ha franquia|sem franquia|isento de franquia|isenta de franquia|franquia isenta|franquia zerada)\b/.test(
			normalized,
		) && franchiseEvidenceLooksPrincipal(evidence)
	);
}

function sourceExplicitNoPrincipalFranchise(sourceText: string): string | null {
	const lines = sourceText.split('\n');

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? '';
		const normalizedLine = normalizeText(line);

		if (
			!/\b(nao ha franquia|sem franquia|isento de franquia|isenta de franquia|franquia isenta|franquia zerada)\b/.test(
				normalizedLine,
			)
		) {
			continue;
		}

		if (franchiseEvidenceLooksPrincipal(line)) {
			return line.trim();
		}

		const previous = lines[index - 1] ?? '';
		const combined = `${previous} ${line}`.trim();
		const normalizedPrevious = normalizeText(previous);

		if (
			/\b(indenizacao integral|ind integral|compreensiva|casco|roubo furto|colisao danos)\b/.test(
				normalizedPrevious,
			) &&
			franchiseEvidenceLooksPrincipal(combined)
		) {
			return combined;
		}
	}

	return null;
}

function franchiseEvidenceConfirmsValue(
	evidence: string | null | undefined,
	value: number,
): boolean {
	if (!evidence) {
		return false;
	}

	if (value === 0) {
		return evidenceExplicitlyStatesNoPrincipalFranchise(evidence);
	}

	return evidenceContainsValue(evidence, value);
}

function typeEvidenceMatches(
	type: 'vehicle_conductor' | 'address' | 'franchise' | 'cancellation',
	evidence: string,
): boolean {
	const normalized = normalizeText(evidence);

	switch (type) {
		case 'vehicle_conductor':
			return /endosso de substituicao|substituicao de veiculo|alteracao de veiculo|troca de veiculo|principal condutor|alteracao de condutor|substituicao de condutor/.test(
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
					.nonnegative('Valor da franquia inválido')
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
					.nonnegative('Valor da franquia inválido'),
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

const SchemaModelNullableString = z
	.string()
	.nullish()
	.transform((value) => value ?? null);

const SchemaModelMoneyNullable = z.preprocess(
	(value) => (value == null ? null : parseBrazilianNumber(value)),
	z.number().finite().nullable(),
);

const SchemaModelPercentageNullable = z.preprocess(
	(value) => (value == null ? null : parseBrazilianNumber(value)),
	z.number().finite().min(0).max(100).nullable(),
);

const SchemaModelIntegerNullable = z.preprocess(
	(value) => (value == null ? null : parseInteger(value)),
	z.number().int().nullable(),
);

const SchemaModelLookup = z
	.object({
		plate: SchemaModelNullableString,
		insuredRegistration: SchemaModelNullableString,
		insuredName: SchemaModelNullableString,
		evidence: SchemaModelNullableString,
	})
	.strict();

const SchemaModelFinancial = z
	.object({
		amount: SchemaModelMoneyNullable,
		amountDirection: z
			.enum(['charge', 'refund', 'neutral'])
			.nullish()
			.transform((value) => value ?? null),
		amountEvidence: SchemaModelNullableString,
		nonLiquidCharges: z
			.array(
				z.preprocess(parseBrazilianNumber, z.number().finite().nonnegative()),
			)
			.nullish()
			.transform((value) => value ?? []),
		finalTotal: SchemaModelMoneyNullable,
		financialEvidence: SchemaModelNullableString,
		percentage: SchemaModelPercentageNullable,
		percentageEvidence: SchemaModelNullableString,
	})
	.strict();

const SchemaModelVehicleConductor = z
	.object({
		type: z.literal('vehicle_conductor'),
		typeEvidence: SchemaModelNullableString,
		lookup: SchemaModelLookup,
		data: z
			.object({
				changeKind: z.enum([
					'vehicle',
					'driver',
					'vehicle_and_driver',
					'unknown',
				]),
				modality: z
					.enum(['vehicle', 'motorcycle', 'unsupported', 'unknown'])
					.nullish()
					.transform((value) => value ?? 'unknown'),
				modalityEvidence: SchemaModelNullableString,
				driver: SchemaModelNullableString,
				plate: SchemaModelNullableString,
				plateStatus: z.enum(['present', 'explicitly_absent', 'unknown']),
				plateEvidence: SchemaModelNullableString,
				model: SchemaModelNullableString,
				modelYear: SchemaModelIntegerNullable,
				franchise: SchemaModelMoneyNullable,
				franchiseEvidence: SchemaModelNullableString,
			})
			.merge(SchemaModelFinancial)
			.strict(),
	})
	.strict();

const SchemaModelAddress = z
	.object({
		type: z.literal('address'),
		typeEvidence: SchemaModelNullableString,
		lookup: SchemaModelLookup,
		data: z
			.object({
				postalCode: z
					.string()
					.nullish()
					.transform((value) => value ?? null),
			})
			.merge(SchemaModelFinancial)
			.strict(),
	})
	.strict();

const SchemaModelFranchise = z
	.object({
		type: z.literal('franchise'),
		typeEvidence: SchemaModelNullableString,
		lookup: SchemaModelLookup,
		data: z
			.object({
				franchise: SchemaModelMoneyNullable,
				franchiseEvidence: SchemaModelNullableString,
			})
			.merge(SchemaModelFinancial)
			.strict(),
	})
	.strict();

const SchemaModelCancellation = z
	.object({
		type: z.literal('cancellation'),
		typeEvidence: SchemaModelNullableString,
		lookup: SchemaModelLookup,
		data: z
			.object({
				effectivedAt: SchemaModelNullableString,
			})
			.strict(),
	})
	.strict();

const SchemaModelUnknown = z
	.object({
		type: z.literal('unknown'),
		typeEvidence: SchemaModelNullableString,
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

ATENÇÃO A ENDOSSOS COM TÍTULO DE "PROPOSTA"
- Algumas seguradoras usam um layout chamado apenas "PROPOSTA" mesmo para uma alteração durante a vigência.
- Se o documento mostrar simultaneamente sinais como "Veículo Igual ao Anterior: Não", apólice/seguradora anterior e efeito financeiro de ajuste (por exemplo "Preço Líquido" negativo ou "Crédito em Conta"), trate como vehicle_conductor com changeKind="vehicle".
- Nesse caso, o valor líquido negativo é restituição/crédito do endosso, NÃO prêmio de uma nova apólice.

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
- data.modality descreve a modalidade do veículo resultante: vehicle, motorcycle, unsupported ou unknown.
- Automóvel, veículo de passeio, SUV, furgão, van, utilitário e pick-up leve => vehicle.
- Moto/motocicleta => motorcycle.
- Caminhão pesado, cavalo mecânico, carreta, semirreboque e ônibus => unsupported.
- "Fretamento (carga/serviços)", entregas, uso comercial ou transporte de carga descrevem USO e NÃO transformam automaticamente furgão/pick-up leve em caminhão.
- categoria/tipo/modelo específico do veículo prevalece sobre "Ramo".
- Categorias contendo "Motocicletas", "Motonetas", "Bicicletas Motorizadas", "SIDE-CAR" ou equivalentes => motorcycle, MESMO que o documento também diga "Ramo: Automóvel".
- "Ramo: Automóvel" pode ser um ramo comercial genérico que inclui motos em algumas seguradoras; use-o como vehicle somente quando não houver categoria/tipo/modelo mais específico.
- modalityEvidence deve ser um trecho curto do documento que sustente a modalidade quando disponível.
- IMPORTANTE: data.driver é SEMPRE o CPF do PRINCIPAL CONDUTOR RESULTANTE após o endosso, mesmo quando o condutor não foi alterado.
- exceção estrutural Suhai: quando o documento usar o layout SUHAI com "DADOS DO PROPONENTE" + "DADOS DO PERFIL", pessoa física, o PERFIL usar idade/sexo/estado civil/utilização do proponente e NÃO houver bloco separado de principal condutor, use lookup.insuredRegistration como o principal condutor resultante;
- Se o documento disser "Principal condutor: Próprio Segurado", "O próprio segurado" ou equivalente, copie para data.driver o CPF do SEGURADO identificado em lookup.insuredRegistration.
- Se o principal condutor for outra pessoa, use o CPF explicitamente associado ao principal condutor.
- Não use null só porque changeKind=vehicle; changeKind descreve o que mudou, enquanto data.driver descreve quem ficou como principal condutor após o endosso.

Quando houver mudança de veículo, retorne os dados RESULTANTES após o endosso:
- data.plate = nova placa;
- data.model = novo modelo;
- data.modelYear = ano modelo;
- data.franchise = franquia PRINCIPAL resultante do veículo; se a cobertura principal declarar explicitamente "Não há franquia"/"Sem franquia", use 0; nunca use 0 apenas por ausência de informação;
- data.plateStatus="explicitly_absent" somente se o PDF mostrar claramente "-", "A AVISAR", "SEM PLACA" ou equivalente; se não localizou a placa, use "unknown".

FRANQUIA PRINCIPAL
Aceite casco/compreensiva/básica/obrigatória/participação obrigatória/25% da normal/50% da obrigatória ou equivalente.
Nunca use franquias de vidro, para-brisa, farol, lanterna, retrovisor, roda, pneu ou assistência.
"franchiseEvidence" deve conter o rótulo da cobertura/franquia principal e o valor, ou o trecho explícito que diga que a cobertura principal não possui franquia.

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
Para líquido positivo, use refund SOMENTE quando a área financeira do endosso indicar explicitamente restituição/crédito/estorno.
Menções genéricas em cláusulas, como possibilidade de "devolução" em caso de recusa futura, NÃO definem a direção financeira deste endosso.
"Cartão de Crédito" é forma de cobrança e não deve ser interpretado como "crédito ao segurado".
Se houver "Tipo de Endosso: ENDOSSO DE COBRANÇA", classifique como charge.

"amountEvidence" deve provar o valor LÍQUIDO escolhido.
"nonLiquidCharges" = IOF, juros, encargos e custos adicionados ao líquido para chegar ao total final; não inclua zeros.
"finalTotal" = total final com tributos/encargos, somente para conferência.
"financialEvidence" deve trazer os trechos curtos usados para conferir líquido + encargos + total.

ENDEREÇO / CEP
Para address, "data.postalCode" é o NOVO CEP resultante do endosso.
- se o documento trouxer o CEP completo com 8 dígitos, retorne o CEP completo;
- se o campo trouxer somente um prefixo regional de 5 dígitos, por exemplo "50630", retorne exatamente "50630";
- NÃO invente os 3 dígitos finais. O sistema tentará localizar um CEP completo compatível em outro ponto do documento e, se não existir, normalizará o prefixo regional preenchendo zeros à direita (50630 -> 50630000);
- não use CEP antigo, CEP do corretor ou CEP de correspondência sem evidência de que seja o novo CEP resultante da alteração.

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
{"type":"vehicle_conductor","typeEvidence":"string|null","lookup":{"plate":"string|null","insuredRegistration":"string|null","insuredName":"string|null","evidence":"string|null"},"data":{"changeKind":"vehicle|driver|vehicle_and_driver|unknown","modality":"vehicle|motorcycle|unsupported|unknown","modalityEvidence":"string|null","driver":"CPF|null","plate":"string|null","plateStatus":"present|explicitly_absent|unknown","plateEvidence":"string|null","model":"string|null","modelYear":2026,"franchise":1234.56,"franchiseEvidence":"string|null","amount":100.25,"amountDirection":"charge|refund|neutral|null","amountEvidence":"string|null","nonLiquidCharges":[7.39],"finalTotal":107.64,"financialEvidence":"string|null","percentage":null,"percentageEvidence":null}}

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
	if (!lookup.insuredRegistration || !lookup.insuredName) {
		throw new Error('Segurado do endosso não identificado com segurança');
	}

	const registrationConfirmed =
		(lookup.evidence
			? evidenceContainsRegistration(
					lookup.evidence,
					lookup.insuredRegistration,
				)
			: false) ||
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

function normalizeFinancialData(
	data: z.infer<typeof SchemaModelFinancial>,
	sourceText: string,
): {
	amount: number;
	percentage: number | null;
} {
	const sourceAmount = sourceLiquidAmount(sourceText);
	let rawAmount = data.amount;
	let amountEvidence = data.amountEvidence;

	if (
		sourceAmount &&
		(rawAmount === null ||
			!amountEvidence ||
			!evidenceContainsValue(amountEvidence, rawAmount) ||
			Math.abs(rawAmount - sourceAmount.value) > MONEY_TOLERANCE)
	) {
		rawAmount = sourceAmount.value;
		amountEvidence = sourceAmount.evidence;
	}

	if (rawAmount === null || !amountEvidence) {
		throw new Error(
			'Não foi possível determinar com segurança o valor líquido do endosso',
		);
	}

	if (!evidenceContainsValue(amountEvidence, rawAmount)) {
		throw new Error('A evidência não confirma o valor líquido do endosso');
	}

	const financialContext = normalizeText(
		`${amountEvidence} ${data.financialEvidence ?? ''} ${sourceFinancialContext(sourceText)}`,
	);

	const sourceDirection = sourceFinancialDirection(
		sourceText,
		rawAmount,
		`${amountEvidence} ${data.financialEvidence ?? ''}`,
	);

	let direction = sourceDirection ?? data.amountDirection;

	// A direção financeira nunca é inferida a partir do documento inteiro.
	// Cláusulas genéricas podem mencionar devolução/restituição sem descrever o
	// efeito financeiro deste endosso. Líquido negativo é restituição; líquido
	// positivo é cobrança, salvo evidência financeira local inequívoca em sentido
	// contrário.
	if (!direction) {
		if (rawAmount > MONEY_TOLERANCE) {
			direction = 'charge';
		} else if (rawAmount < -MONEY_TOLERANCE) {
			direction = 'refund';
		} else {
			throw new Error('Valor zero sem indicação explícita de neutralidade');
		}
	}

	let amount: number;

	switch (direction) {
		case 'charge': {
			if (rawAmount < 0) {
				throw new Error(
					'Endosso marcado como cobrança com valor líquido negativo',
				);
			}

			amount = Math.abs(rawAmount);
			break;
		}

		case 'refund': {
			const hasRefundSignal =
				rawAmount < 0 ||
				/restituicao de premio|credito em conta|estorno|a restituir/.test(
					financialContext,
				);

			if (!hasRefundSignal) {
				throw new Error(
					'Endosso marcado como restituição sem evidência suficiente de crédito/restituição',
				);
			}

			amount = -Math.abs(rawAmount);
			break;
		}

		case 'neutral': {
			if (Math.abs(rawAmount) > 0.01) {
				throw new Error(
					'Endosso neutro possui valor financeiro diferente de zero',
				);
			}

			if (
				!/sem.*(cobranca|movimentacao|premio)|sem premio|sem movimento/.test(
					financialContext,
				)
			) {
				throw new Error('Endosso neutro sem evidência explícita de valor zero');
			}

			amount = 0;
			break;
		}
	}

	// finalTotal e encargos são campos auxiliares de conferência, não fazem parte
	// da saída final. Se a IA omitir a evidência deles, não rejeitamos uma extração
	// cujo valor líquido já foi confirmado pelo documento. Quando a evidência vem,
	// continuamos validando matematicamente tudo.
	if (data.finalTotal !== null) {
		const sourceFinancialEvidence = sourceFinancialContext(sourceText);
		const totalConfirmed =
			evidenceContainsValue(data.financialEvidence, data.finalTotal) ||
			evidenceContainsValue(sourceFinancialEvidence, data.finalTotal);

		if (!totalConfirmed) {
			throw new Error('O documento não confirma o total final do endosso');
		}

		for (const charge of data.nonLiquidCharges) {
			const chargeConfirmed =
				evidenceContainsValue(data.financialEvidence, charge) ||
				evidenceContainsValue(sourceFinancialEvidence, charge);

			if (!chargeConfirmed) {
				throw new Error('O documento não confirma os encargos do endosso');
			}
		}

		assertDocumentFinancialReconciliation({
			liquid: rawAmount,
			charges: data.nonLiquidCharges,
			total: data.finalTotal,
			sourceText,
			message:
				'Valor líquido, encargos e total final do endosso são inconsistentes',
		});
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

function assertDocumentFinancialReconciliation({
	liquid,
	charges,
	total,
	sourceText,
	message,
}: {
	liquid: number;
	charges: Array<number>;
	total: number;
	sourceText: string;
	message: string;
}): void {
	const calculated = Math.abs(liquid) + sum(charges);
	const expectedTotal = Math.abs(total);
	const difference = Math.abs(calculated - expectedTotal);

	if (difference <= MONEY_TOLERANCE) {
		return;
	}

	const sourceFinancialEvidence = sourceFinancialContext(sourceText);
	const sourceConfirmsAllValues =
		evidenceContainsValue(sourceFinancialEvidence, Math.abs(liquid)) &&
		charges.every((charge) =>
			evidenceContainsValue(sourceFinancialEvidence, charge),
		) &&
		evidenceContainsValue(sourceFinancialEvidence, expectedTotal);

	if (
		sourceConfirmsAllValues &&
		difference <= DOCUMENT_FINANCIAL_RECONCILIATION_TOLERANCE
	) {
		console.warn(
			`[extract-endorsement:v40] diferença residual no fechamento financeiro: calculado=${calculated.toFixed(
				2,
			)} total=${expectedTotal.toFixed(2)} diferença=${difference.toFixed(2)}`,
		);
		return;
	}

	throw new Error(message);
}

function sourceSupportsEndorsementType(
	type: 'vehicle_conductor' | 'address' | 'franchise' | 'cancellation',
	sourceText: string,
): boolean {
	const normalized = normalizeText(sourceText);

	switch (type) {
		case 'vehicle_conductor':
			return (
				sourceLooksLikeVehicleSubstitutionAdjustment(sourceText) ||
				[
					/\bproposta de endosso de substituicao\b/,
					/\bendosso de substituicao(?: de)? veiculo\b/,
					/\bsubstituicao de veiculo\b/,
					/\btipo de endosso substituicao de veiculo\b/,
					/\bdados do veiculo substituido\b/,
					/\balteracao do principal condutor\b/,
					/\balteracao de principal condutor\b/,
					/\bsubstituicao de condutor\b/,
				].some((pattern) => pattern.test(normalized))
			);

		case 'address':
			return [
				/\btipo de endosso alteracao de endereco\b/,
				/\bendosso de alteracao de endereco\b/,
				/\balteracao de cep de pernoite\b/,
				/\balteracao do cep de pernoite\b/,
				/\balteracao de local de risco\b/,
				/\balteracao do local de risco\b/,
			].some((pattern) => pattern.test(normalized));

		case 'franchise':
			return [
				/\btipo de endosso alteracao de franquia\b/,
				/\bendosso de alteracao de franquia\b/,
				/\balteracao da franquia\b/,
				/\balteracao de franquia\b/,
			].some((pattern) => pattern.test(normalized));

		case 'cancellation':
			return [
				/\btipo de endosso cancelamento\b/,
				/\bendosso de cancelamento\b/,
				/\bcancelamento da apolice\b/,
				/\bcancelamento do seguro\b/,
				/\brescisao da apolice\b/,
				/\bencerramento da apolice\b/,
			].some((pattern) => pattern.test(normalized));
	}
}

function validateTypeEvidence(
	type: 'vehicle_conductor' | 'address' | 'franchise' | 'cancellation',
	evidence: string | null,
	sourceText: string,
): void {
	const modelEvidenceIsValid =
		!!evidence && typeEvidenceMatches(type, evidence);
	const documentEvidenceIsValid = sourceSupportsEndorsementType(
		type,
		sourceText,
	);

	if (!modelEvidenceIsValid && !documentEvidenceIsValid) {
		throw new Error(
			`Tipo de endosso ${type} identificado sem evidência suficiente`,
		);
	}
}

function normalizeResultingPlate(
	plate: string | null,
	status: 'present' | 'explicitly_absent' | 'unknown',
	evidence: string | null,
	sourceText: string,
): string | null {
	const rawPlateIsExplicitlyAbsent = isExplicitPlateAbsenceValue(plate);
	const normalized = rawPlateIsExplicitlyAbsent
		? null
		: SchemaPlateLenient.parse(plate);
	const evidenceConfirmsAbsence = evidenceShowsExplicitPlateAbsence(evidence);
	const sourceConfirmsAbsence = sourceShowsExplicitPlateAbsence(sourceText);
	const explicitAbsence =
		rawPlateIsExplicitlyAbsent ||
		evidenceConfirmsAbsence ||
		sourceConfirmsAbsence;

	if (normalized) {
		if (sourceConfirmsAbsence) {
			throw new Error(
				'Documento apresenta sinais conflitantes sobre a nova placa do endosso',
			);
		}

		const compactEvidence = evidence ? compactAlphanumeric(evidence) : '';

		if (
			!compactEvidence.includes(normalized) &&
			!sourceContainsPlateNear(sourceText, normalized)
		) {
			throw new Error('A evidência não confirma a nova placa do endosso');
		}

		return normalized;
	}

	// Assim como na proposta, o documento é a autoridade. Se ele comprova
	// ausência de placa, um status="present" incorreto da IA não gera falso 409.
	if (explicitAbsence) {
		return null;
	}

	if (status === 'explicitly_absent') {
		throw new Error(
			'Ausência de nova placa informada sem evidência documental',
		);
	}

	if (status === 'present') {
		throw new Error(
			'A IA indicou existência de nova placa, mas não retornou uma placa brasileira válida nem evidência de ausência explícita',
		);
	}

	throw new Error('Não foi possível determinar a nova placa com segurança');
}

function finalizeModelOutput(
	raw: ModelOutput,
	sourceText: string,
): DataExtractEndorsement {
	if (raw.type === 'unknown') {
		if (sourceLooksLikeVehicleSubstitutionAdjustment(sourceText)) {
			throw new Error(
				'O documento possui sinais claros de substituição de veículo, mas a IA não retornou os dados estruturados de vehicle_conductor',
			);
		}

		throw new Error(
			`Tipo de endosso não suportado ou não identificado com segurança: ${raw.data.reason}`,
		);
	}

	validateTypeEvidence(raw.type, raw.typeEvidence, sourceText);
	const lookup = normalizeLookup(raw.lookup, sourceText);

	const unsupportedModalityEvidence =
		sourceExplicitlyUnsupportedEndorsementModality(sourceText);

	if (unsupportedModalityEvidence) {
		throw new Error('Modalidade do veículo do endosso não suportada');
	}

	switch (raw.type) {
		case 'vehicle_conductor': {
			const inferredVehicleChange =
				sourceLooksLikeVehicleSubstitutionAdjustment(sourceText);
			const changeKind =
				raw.data.changeKind === 'unknown' && inferredVehicleChange
					? 'vehicle'
					: raw.data.changeKind;

			if (changeKind === 'unknown') {
				throw new Error(
					'Alteração de veículo/condutor não identificada com segurança',
				);
			}

			const financial = normalizeFinancialData(raw.data, sourceText);
			const changesVehicle =
				changeKind === 'vehicle' || changeKind === 'vehicle_and_driver';
			const changesDriver =
				changeKind === 'driver' || changeKind === 'vehicle_and_driver';

			let plate: string | null = null;
			let model: string | null = null;
			let modelYear: number | null = null;
			let franchise: number | null = null;

			if (changesVehicle) {
				const resolvedModality = resolveSupportedEndorsementModality(
					raw.data.modality,
					raw.data.modalityEvidence,
					sourceText,
				);

				if (!resolvedModality) {
					throw new Error(
						'Modalidade do veículo resultante não suportada ou não identificada com segurança',
					);
				}

				plate = normalizeResultingPlate(
					raw.data.plate,
					raw.data.plateStatus,
					raw.data.plateEvidence,
					sourceText,
				);

				const sourceFranchise = sourcePrincipalFranchise(sourceText);
				let resolvedFranchise = raw.data.franchise;
				let franchiseEvidence = raw.data.franchiseEvidence;

				if (
					sourceFranchise &&
					(resolvedFranchise === null ||
						!franchiseEvidence ||
						!franchiseEvidenceConfirmsValue(
							franchiseEvidence,
							resolvedFranchise,
						) ||
						!franchiseEvidenceLooksPrincipal(franchiseEvidence))
				) {
					resolvedFranchise = sourceFranchise.value;
					franchiseEvidence = sourceFranchise.evidence;
				}

				if (
					!raw.data.model ||
					raw.data.modelYear === null ||
					resolvedFranchise === null ||
					resolvedFranchise < 0 ||
					!franchiseEvidence
				) {
					throw new Error(
						'Substituição de veículo sem modelo, ano ou franquia principal confirmados',
					);
				}

				if (
					!franchiseEvidenceConfirmsValue(franchiseEvidence, resolvedFranchise)
				) {
					throw new Error(
						'A evidência não confirma a franquia principal resultante',
					);
				}

				if (!franchiseEvidenceLooksPrincipal(franchiseEvidence)) {
					throw new Error(
						'A evidência não permite confirmar que a franquia seja a principal',
					);
				}

				model = raw.data.model;
				modelYear = raw.data.modelYear;
				franchise = resolvedFranchise;
			}

			const driver = resolvePrincipalDriverCpf({
				modelDriver: raw.data.driver,
				lookup,
				sourceText,
			});

			if (!driver) {
				throw new Error(
					changesDriver
						? 'Alteração de condutor sem CPF do novo principal condutor confirmado'
						: 'Principal condutor resultante não identificado com segurança',
				);
			}

			const resultLookup =
				changesVehicle &&
				lookup.plate &&
				plate &&
				lookup.plate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === plate
					? { ...lookup, plate: null }
					: lookup;

			return SchemaDataExtractVehicleConductor.parse({
				type: 'vehicle_conductor',
				lookup: resultLookup,
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
			const postalCode = resolveEndorsementPostalCode(
				raw.data.postalCode,
				sourceText,
			);
			const financial = normalizeFinancialData(raw.data, sourceText);

			return SchemaDataExtractAddress.parse({
				type: 'address',
				lookup,
				data: {
					postalCode,
					amount: financial.amount,
					percentage: financial.percentage,
				},
			});
		}

		case 'franchise': {
			const sourceFranchise = sourcePrincipalFranchise(sourceText);
			let resolvedFranchise = raw.data.franchise;
			let franchiseEvidence = raw.data.franchiseEvidence;

			if (
				sourceFranchise &&
				(resolvedFranchise === null ||
					resolvedFranchise < 0 ||
					!franchiseEvidence ||
					!franchiseEvidenceConfirmsValue(
						franchiseEvidence,
						resolvedFranchise,
					) ||
					!franchiseEvidenceLooksPrincipal(franchiseEvidence))
			) {
				resolvedFranchise = sourceFranchise.value;
				franchiseEvidence = sourceFranchise.evidence;
			}

			if (
				resolvedFranchise === null ||
				resolvedFranchise < 0 ||
				!franchiseEvidence
			) {
				throw new Error('Endosso de franquia sem novo valor confirmado');
			}

			if (
				!franchiseEvidenceConfirmsValue(franchiseEvidence, resolvedFranchise)
			) {
				throw new Error('A evidência não confirma a nova franquia');
			}

			if (!franchiseEvidenceLooksPrincipal(franchiseEvidence)) {
				throw new Error(
					'A evidência não confirma que seja a franquia principal',
				);
			}

			const financial = normalizeFinancialData(raw.data, sourceText);

			return SchemaDataExtractFranchise.parse({
				type: 'franchise',
				lookup,
				data: {
					franchise: resolvedFranchise,
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
				const cacheKey = `endorsement-pdf-extract:v40:${hash}`;
				const cached = await ctx.cache.get(cacheKey);

				console.log(
					`[extract-endorsement:v40] hash=${hash} cache=${cached ? 'hit' : 'miss'}`,
				);

				let extracted: DataExtractEndorsement;
				let shouldCache = !cached;

				if (cached) {
					try {
						extracted = SchemaDataExtractEndorsement.parse(JSON.parse(cached));
					} catch (error) {
						console.warn(
							'[extract-endorsement:v40] cache incompatível, executando nova extração:',
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
