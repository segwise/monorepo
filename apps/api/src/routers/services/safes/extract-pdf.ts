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

function sourceFinancialContext(sourceText: string): string {
	const lines = sourceText.split('\n');
	const blocks: string[] = [];

	for (let index = 0; index < lines.length; index += 1) {
		const normalizedLine = normalizeText(lines[index] ?? '');

		if (
			!/(valor liquido|premio liquido|preco liquido|liquido auto|forma de pagamento|informacoes de pagamento|demonstrativo de premio|premios|iof|juros|encargos|custo de emissao|custo de apolice|adic fracionamento|adicional de fracionamento|valor total|preco total|premio total|total a pagar)/.test(
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

function financialEvidenceContainsValue(
	evidence: string | null | undefined,
	sourceText: string,
	value: number,
	tolerance = 0.02,
): boolean {
	return (
		evidenceContainsValue(evidence, value, tolerance) ||
		evidenceContainsValue(sourceFinancialContext(sourceText), value, tolerance)
	);
}

function digitsOnly(value: string): string {
	return value.replace(/\D/g, '');
}

type SupportedModality = 'vehicle' | 'motorcycle';

type ResolvedModality = {
	modality: SupportedModality;
	evidence: string;
};

function sourceExplicitlyUnsupportedModality(
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

function sourceSupportedModality(sourceText: string): ResolvedModality | null {
	const lines = sourceText.split('\n');
	const specificCandidates: Array<ResolvedModality & { score: number }> = [];
	const genericCandidates: Array<ResolvedModality & { score: number }> = [];

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
			/\b(tipo do veiculo|categoria(?: de risco)?|marca modelo do veiculo|dados do veiculo segurado)\b/.test(
				normalizedLine,
			);

		// Categoria/tipo/modelo específico prevalece sobre ramos comerciais amplos.
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

		// Em algumas seguradoras, "Ramo: Automóvel" é um ramo comercial amplo
		// que também contém motocicletas. Use apenas como fallback.
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

function resolveSupportedModality(
	modelModality: 'vehicle' | 'motorcycle' | 'unsupported' | 'unknown',
	modelEvidence: string | null,
	sourceText: string,
): ResolvedModality | null {
	if (sourceExplicitlyUnsupportedModality(sourceText)) {
		return null;
	}

	const sourceResolved = sourceSupportedModality(sourceText);

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

function parseCpfCandidate(value: string | null | undefined): string | null {
	if (!value) {
		return null;
	}

	const direct = SchemaCPF.safeParse(value);

	if (direct.success) {
		return direct.data;
	}

	const digits = digitsOnly(value);
	const normalized = SchemaCPF.safeParse(digits);

	return normalized.success ? normalized.data : null;
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

	// Se houver um bloco explícito de condutor, ele deve prevalecer.
	const hasExplicitDriverSection =
		/\bprincipal condutor\b|\bcondutor principal\b|\bnome do principal condutor\b|\bcpf condutor\b|\binformacoes do condutor principal\b/.test(
			normalized,
		);

	// Em propostas Suhai desse layout, o PERFIL pertence ao próprio proponente
	// quando não existe bloco separado de condutor. A confirmação é estrutural:
	// SUHAI + DADOS DO PROPONENTE + pessoa física + CPF do segurado nesse bloco
	// + DADOS DO PERFIL + ausência de um condutor separado.
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
		const end = Math.min(lines.length, index + 4);
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

function evidenceMarksPrincipalDriverAsInsured(
	evidence: string | null | undefined,
): boolean {
	if (!evidence) {
		return false;
	}

	const normalized = normalizeText(evidence);

	return (
		/\bproprio segurado\b|\bo proprio segurado\b|\bmesmo segurado\b|\bproprio proponente\b|\bo proprio proponente\b/.test(
			normalized,
		) || /\bsegurado e o principal condutor\b.{0,40}\bsim\b/.test(normalized)
	);
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

function pernoiteContextBlocks(sourceText: string): Array<string> {
	const lines = sourceText.split('\n');
	const blocks: Array<string> = [];

	for (let index = 0; index < lines.length; index += 1) {
		const normalizedLine = normalizeText(lines[index] ?? '');

		if (
			!normalizedLine.includes('cep pernoite') &&
			!normalizedLine.includes('cep de pernoite') &&
			!normalizedLine.includes('cep onde pernoita') &&
			!normalizedLine.includes('cep onde o veiculo pernoita')
		) {
			continue;
		}

		const start = Math.max(0, index - 1);
		const end = Math.min(lines.length, index + 8);
		blocks.push(lines.slice(start, end).join('\n'));
	}

	return blocks;
}

function resolveOvernightStayPostalCode(
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
	const pernoiteBlocks = pernoiteContextBlocks(sourceText);

	// Alguns layouts (especialmente Yelum) imprimem no campo de pernoite apenas
	// o prefixo regional de 5 dígitos, por exemplo:
	// "Reg. Tarif./CEP Pernoite 2300 / 50630".
	//
	// Regra de resolução:
	// 1. se houver um único CEP completo no documento com o mesmo prefixo, usamos ele;
	// 2. se não houver CEP completo compatível, preservamos a informação regional
	//    completando à direita com zeros: 50630 -> 50630000;
	// 3. se houver mais de um prefixo plausível, rejeitamos em vez de escolher um.
	const rawPrefixes = new Set<string>();
	const prefixes = new Set<string>();

	if (rawValue) {
		for (const prefix of fiveDigitPostalPrefixes(rawValue)) {
			rawPrefixes.add(prefix);
			prefixes.add(prefix);
		}

		const compactRaw = digitsOnly(rawValue);

		if (compactRaw.length === 5) {
			rawPrefixes.add(compactRaw);
			prefixes.add(compactRaw);
		}
	}

	for (const block of pernoiteBlocks) {
		const fullCodesInBlock = uniquePostalCodesFromText(block);

		if (fullCodesInBlock.length === 1) {
			return fullCodesInBlock[0] as string;
		}

		for (const prefix of fiveDigitPostalPrefixes(block)) {
			prefixes.add(prefix);
		}
	}

	const compatible = new Set<string>();

	for (const prefix of prefixes) {
		for (const candidate of allFullPostalCodes) {
			if (digitsOnly(candidate).startsWith(prefix)) {
				compatible.add(candidate);
			}
		}
	}

	if (compatible.size === 1) {
		const [resolved] = compatible;

		if (resolved) {
			return resolved;
		}
	}

	if (compatible.size > 1) {
		throw new Error(
			'CEP de pernoite aparece apenas parcialmente e corresponde a mais de um CEP completo no documento',
		);
	}

	// Se nenhum CEP completo compatível existir, o prefixo de 5 dígitos ainda
	// identifica a região postal. Nesse caso completamos somente à direita com
	// zeros para produzir um CEP de 8 dígitos válido para persistência.
	// Ex.: 50630 -> 50630000.
	// Damos prioridade ao prefixo retornado especificamente para o campo de
	// pernoite; só usamos os prefixos encontrados no bloco textual quando a IA
	// não retornou nenhum prefixo aproveitável.
	const fallbackPrefixes = rawPrefixes.size > 0 ? rawPrefixes : prefixes;

	if (fallbackPrefixes.size === 1) {
		const [prefix] = fallbackPrefixes;

		if (prefix) {
			const regionalPostalCode = SchemaPostalCode.safeParse(
				prefix.padEnd(8, '0'),
			);

			if (regionalPostalCode.success) {
				return regionalPostalCode.data;
			}
		}
	}

	if (fallbackPrefixes.size > 1) {
		throw new Error(
			'CEP de pernoite aparece apenas parcialmente e há mais de um prefixo regional possível',
		);
	}

	throw new Error(
		'Não foi possível determinar o CEP de pernoite com segurança',
	);
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

	// Exemplos: "Placa: -", "Placa -", "PLACA —".
	return /\bplaca\b\s*:?\s*[-–—]+(?:\s|$)/i.test(evidence);
}

function sourceShowsExplicitPlateAbsence(sourceText: string): boolean {
	const raw = sourceText.replace(/\r/g, '');

	// Casos em que o valor aparece na mesma linha do rótulo.
	if (
		/\bplaca\b\s*:?\s*(?:[-–—]+|a\s+avisar|avisar|sem\s+placa|s\/?\s*placa|placa\s+n[aã]o\s+informada)(?=\s|$)/im.test(
			raw,
		)
	) {
		return true;
	}

	// Alguns extratores posicionam a célula antes do rótulo da coluna:
	// "-\nPlaca\n<chassi>\nChassi". Esse hífen também é ausência explícita.
	if (/(?:^|\n)\s*[-–—]+\s*\n\s*placa\b/i.test(raw)) {
		return true;
	}

	const lines = raw.split('\n');

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? '';
		const normalizedLine = normalizeText(line);

		if (!normalizedLine.includes('placa')) {
			continue;
		}

		// Alguns parsers de PDF (inclusive em layouts Porto/Azul/Itaú)
		// podem linearizar a tabela com o VALOR antes do rótulo, por exemplo:
		//
		//   -
		//   Placa
		//   LC0CE4CB4T0012228
		//   Chassi
		//
		// Nesse caso o hífen imediatamente anterior a "Placa" é a célula
		// explícita da placa, enquanto a linha seguinte é o valor do chassi.
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

			// Paramos no primeiro conteúdo não vazio anterior para não capturar
			// hífens pertencentes a outro campo/seção.
			break;
		}

		const start = Math.max(0, index - 1);
		const end = Math.min(lines.length, index + 8);
		const blockLines = lines.slice(start, end);
		const block = blockLines.join('\n');
		const normalizedBlock = normalizeText(block);

		if (
			/\b(a avisar|avisar|sem placa|s placa|zero km sem placa|0 km sem placa|placa nao informada|nao possui placa)\b/.test(
				normalizedBlock,
			)
		) {
			return true;
		}

		if (/\bplaca\b\s*:?\s*[-–—]+(?:\s|$)/i.test(block)) {
			return true;
		}

		const looksLikeVehicleTableHeader =
			normalizedLine.includes('chassi') ||
			normalizedLine.includes('veiculo') ||
			normalizedLine.includes('ano') ||
			normalizedLine.includes('fipe') ||
			normalizedLine.includes('zero km');

		// Layouts tabulares podem trazer:
		// "Placa    Chassi    Veículo    Ano ..."
		// "-        LC0CE4... ..."
		if (looksLikeVehicleTableHeader) {
			for (const candidate of lines.slice(index + 1, index + 5)) {
				if (!candidate?.trim()) {
					continue;
				}

				if (/^\s*[-–—]+(?=\s|$)/.test(candidate)) {
					return true;
				}

				// Depois da primeira linha efetiva de valores já não precisamos avançar,
				// evitando capturar um hífen de outra seção da página.
				break;
			}
		}
	}

	// Alguns extratores de PDF perdem as quebras de linha da tabela. Neste caso
	// preservamos os hífens, compactamos somente os espaços e verificamos a
	// sequência estrutural "Placa ... Chassi ... - <chassi>".
	const flattened = raw.replace(/\s+/g, ' ');

	if (
		/\bplaca\b(?=.{0,180}\bchassi\b).{0,320}?[-–—]\s+[A-Z0-9]{12,20}\b/i.test(
			flattened,
		) ||
		/[-–—]\s+placa\s+[A-Z0-9]{12,20}\s+chassi\b/i.test(flattened)
	) {
		return true;
	}

	return false;
}

function sourceContainsPlateNear(sourceText: string, plate: string): boolean {
	const expected = compactAlphanumeric(plate);

	if (!expected) {
		return false;
	}

	const lines = sourceText.split('\n');

	for (let index = 0; index < lines.length; index += 1) {
		const normalizedLine = normalizeText(lines[index] ?? '');

		if (!normalizedLine.includes('placa')) {
			continue;
		}

		const start = Math.max(0, index - 1);
		const end = Math.min(lines.length, index + 6);
		const block = compactAlphanumeric(lines.slice(start, end).join(' '));

		if (block.includes(expected)) {
			return true;
		}
	}

	return false;
}

function resolveVehiclePlate(
	vehicle: ModelOutput['vehicle'],
	sourceText: string,
): string | null {
	const rawPlateIsExplicitlyAbsent = isExplicitPlateAbsenceValue(vehicle.plate);
	const parsedPlate = rawPlateIsExplicitlyAbsent
		? null
		: SchemaPlateLenient.parse(vehicle.plate);

	const evidenceConfirmsAbsence = evidenceShowsExplicitPlateAbsence(
		vehicle.plateEvidence,
	);
	const sourceConfirmsAbsence = sourceShowsExplicitPlateAbsence(sourceText);
	const explicitAbsence =
		rawPlateIsExplicitlyAbsent ||
		evidenceConfirmsAbsence ||
		sourceConfirmsAbsence;

	// O documento é a autoridade. Se ele comprova ausência de placa, um
	// plateStatus="present" incorreto da IA não transforma o caso em conflito.
	// Só tratamos como conflito quando existe uma placa brasileira válida e
	// também evidência documental forte de ausência.
	if (parsedPlate) {
		if (sourceConfirmsAbsence) {
			throw new Error(
				'Documento apresenta sinais conflitantes sobre a existência da placa do veículo',
			);
		}

		const evidenceConfirms = vehicle.plateEvidence
			? compactAlphanumeric(vehicle.plateEvidence).includes(parsedPlate)
			: false;

		if (
			!evidenceConfirms &&
			!sourceContainsPlateNear(sourceText, parsedPlate)
		) {
			throw new Error('A evidência não confirma a placa do veículo');
		}

		return parsedPlate;
	}

	if (explicitAbsence) {
		return null;
	}

	console.warn(
		`[extract-pdf] placa não resolvida ${JSON.stringify({
			plate: vehicle.plate,
			plateStatus: vehicle.plateStatus,
			plateEvidence: vehicle.plateEvidence,
			sourceConfirmsAbsence,
			evidenceConfirmsAbsence,
			rawPlateIsExplicitlyAbsent,
		})}`,
	);

	if (vehicle.plateStatus === 'explicitly_absent') {
		throw new Error('Ausência de placa informada sem evidência documental');
	}

	if (vehicle.plateStatus === 'present') {
		throw new Error(
			'A IA indicou existência de placa, mas não retornou uma placa brasileira válida nem evidência de ausência explícita',
		);
	}

	throw new Error('Não foi possível determinar a placa com segurança');
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
		new RegExp(`parcelas?\\s*[:=-]?\\s*0*${installments}\\b`, 'i'),
		new RegExp(
			`numero\\s+de\\s+parcelas?\\s*[:=-]?\\s*0*${installments}\\b`,
			'i',
		),
		new RegExp(
			`quant(?:idade)?\\.?\\s*(?:de\\s+)?parcelas?\\s*[:=-]?\\s*0*${installments}\\b`,
			'i',
		),
		new RegExp(`em\\s+0*${installments}\\s+parcelas?\\b`, 'i'),
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

function installmentCandidatesFromSource(sourceText: string): number[] {
	const candidates = new Set<number>();
	const lines = sourceText.split('\n');

	const addCandidate = (value: number) => {
		if (Number.isInteger(value) && value >= 1 && value <= 60) {
			candidates.add(value);
		}
	};

	for (let index = 0; index < lines.length; index += 1) {
		const contextStart = Math.max(0, index - 1);
		const contextEnd = Math.min(lines.length, index + 2);
		const block = lines.slice(contextStart, contextEnd).join(' ');
		const normalizedBlock = normalizeText(block);

		if (
			!/parcela|forma de pagamento|forma de cobranca|informacoes de pagamento|codigo do plano|tipo de cobranca/.test(
				normalizedBlock,
			)
		) {
			continue;
		}

		const quantityPatterns = [
			/quant(?:idade)?\.?\s*(?:de\s+)?parcelas?\s*[:=-]?\s*0*(\d{1,2})\b/i,
			/n(?:u|ú)mero\s*(?:de\s+)?parcelas?\s*[:=-]?\s*0*(\d{1,2})\b/i,
			/\b0*(\d{1,2})\s*x\b/i,
			/\b0*(\d{1,2})\s*parc(?:ela)?s?\b/i,
			/\bem\s+0*(\d{1,2})\s+parcelas?\b/i,
		];

		for (const pattern of quantityPatterns) {
			const match = block.match(pattern);
			if (match?.[1]) {
				addCandidate(Number(match[1]));
			}
		}

		const split = block.match(/\b(\d{1,2})\s*\+\s*(\d{1,2})\b/);
		if (split?.[1] && split[2]) {
			addCandidate(Number(split[1]) + Number(split[2]));
		}
	}

	return [...candidates].sort((a, b) => a - b);
}

function resolveInstallments(
	raw: ModelOutput['financial'],
	sourceText: string,
): number {
	const sourceCandidates = installmentCandidatesFromSource(sourceText);

	if (sourceCandidates.length === 1) {
		const sourceInstallments = sourceCandidates[0] as number;

		if (raw.installments !== null && raw.installments !== sourceInstallments) {
			console.warn(
				`[extract-pdf] parcelas corrigidas pela evidência estrutural: modelo=${raw.installments} documento=${sourceInstallments}`,
			);
		}

		return sourceInstallments;
	}

	if (
		raw.installments !== null &&
		raw.installments >= 1 &&
		evidenceSupportsInstallments(raw.installmentsEvidence, raw.installments)
	) {
		return raw.installments;
	}

	if (
		raw.installments !== null &&
		raw.installments >= 1 &&
		sourceCandidates.includes(raw.installments)
	) {
		return raw.installments;
	}

	if (sourceCandidates.length > 1) {
		throw new Error(
			`Quantidade de parcelas ambígua no documento: ${sourceCandidates.join(', ')}`,
		);
	}

	if (raw.installments === null || raw.installments < 1) {
		throw new Error('Não foi possível determinar a quantidade de parcelas');
	}

	throw new Error('A evidência não confirma a quantidade de parcelas');
}

const COMPANY_STOP_WORDS = new Set([
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

function companyTokens(companyName: string): Array<string> {
	return normalizeText(companyName)
		.split(' ')
		.filter(
			(token) =>
				token.length >= 2 &&
				!COMPANY_STOP_WORDS.has(token) &&
				!/^\d+$/.test(token),
		);
}

function companyEvidenceMatches(
	companyName: string,
	evidence: string,
): boolean {
	const source = normalizeText(evidence);
	const tokens = companyTokens(companyName);

	return tokens.length > 0 && tokens.some((token) => source.includes(token));
}

function companySourceScore(
	companyName: string,
	sourceText: string,
	modelEvidence: string | null,
	modelBasis: 'commercial_brand' | 'legal_issuer' | null,
	isModelSelection: boolean,
): number {
	const tokens = companyTokens(companyName);

	if (!tokens.length) {
		return Number.NEGATIVE_INFINITY;
	}

	const lines = sourceText.split('\n');
	let page = 1;
	let score = 0;

	for (let index = 0; index < lines.length; index += 1) {
		const rawLine = lines[index] ?? '';
		const normalizedLine = normalizeText(rawLine);

		const pageMatch = normalizedLine.match(/^pagina\s+(\d+)$/);
		if (pageMatch?.[1]) {
			page = Number(pageMatch[1]);
			continue;
		}

		if (!tokens.some((token) => normalizedLine.includes(token))) {
			continue;
		}

		const start = Math.max(0, index - 1);
		const end = Math.min(lines.length, index + 2);
		const context = normalizeText(lines.slice(start, end).join(' '));

		const previousContext =
			/seguradora anterior|cia anterior|congenere|origem do bonus|apolice anterior|renovacao congenere|renova apolice/.test(
				context,
			);

		if (previousContext) {
			score -= 20;
			continue;
		}

		score += 2;

		if (page === 1) {
			score += 4;
		}

		if (
			/segmento|produto|tradicional|proposta de seguro|seguro auto|seguro moto|oferta|modalidade/.test(
				context,
			)
		) {
			score += 7;
		}

		if (normalizedLine.length <= 80) {
			score += 2;
		}

		if (
			/dados da seguradora|cnpj|codigo da seguradora|codigo susep|este seguro e garantido|garantido pela|garantido por|canais de atendimento/.test(
				context,
			)
		) {
			score -= 3;
		}

		if (/operado pela|grupo/.test(context)) {
			score -= 2;
		}
	}

	if (modelEvidence && companyEvidenceMatches(companyName, modelEvidence)) {
		score += modelBasis === 'commercial_brand' ? 8 : 3;
	}

	if (isModelSelection) {
		score += 1;
	}

	return score;
}

function resolveInsuranceCompany(
	raw: ModelOutput['insuranceCompany'],
	insuranceCompanies: Array<InsuranceCompanyRow>,
	sourceText: string,
): InsuranceCompanyRow {
	const modelIndex = raw.index;
	const modelCompany =
		modelIndex && modelIndex >= 1
			? (insuranceCompanies[modelIndex - 1] ?? null)
			: null;

	const scored = insuranceCompanies
		.map((company, index) => ({
			company,
			index: index + 1,
			score: companySourceScore(
				company.name,
				sourceText,
				raw.evidence,
				raw.basis,
				index + 1 === modelIndex,
			),
		}))
		.filter((candidate) => Number.isFinite(candidate.score))
		.sort((a, b) => b.score - a.score || a.index - b.index);

	const first = scored[0];
	const second = scored[1];

	if (
		first &&
		first.score >= 10 &&
		(!second || first.score - second.score >= 4)
	) {
		return first.company;
	}

	if (raw.evidence) {
		const evidenceCandidates = insuranceCompanies.filter((company) =>
			companyEvidenceMatches(company.name, raw.evidence as string),
		);

		if (evidenceCandidates.length === 1) {
			const candidate = evidenceCandidates[0];

			if (candidate) {
				return candidate;
			}
		}
	}

	if (
		modelCompany &&
		raw.evidence &&
		companyEvidenceMatches(modelCompany.name, raw.evidence)
	) {
		return modelCompany;
	}

	throw new Error(
		'Não foi possível determinar a marca/seguradora comercial atual com segurança',
	);
}

function principalVehicleCoverageLooksPrincipal(evidence: string): boolean {
	const normalized = normalizeText(evidence);

	const clearlySecondaryOrOtherProduct =
		/\b(rcf|danos materiais|danos corporais|danos morais|app|vidro|vidros|para brisa|parabrisa|farol|farois|lanterna|lanternas|retrovisor|retrovisores|assistencia|carro reserva|residencia|residencial|incendio|vendaval|responsabilidade civil familiar|aluguel|predio|conteudo|local em risco)\b/.test(
			normalized,
		);

	const principalVehicleCoverage =
		/\b(casco|compreensiva|basica|indenizacao parcial do veiculo|indenizacao integral|ind integral|roubo furto|colisao danos)\b/.test(
			normalized,
		);

	return principalVehicleCoverage && !clearlySecondaryOrOtherProduct;
}

function franchiseEvidenceLooksPrincipal(evidence: string): boolean {
	const normalized = normalizeText(evidence);

	if (principalVehicleCoverageLooksPrincipal(evidence)) {
		return true;
	}

	const otherProduct =
		/\b(residencia|residencial|incendio|vendaval|responsabilidade civil familiar|aluguel|predio|conteudo|local em risco)\b/.test(
			normalized,
		);

	if (otherProduct) {
		return false;
	}

	const accessory =
		/\b(vidro|vidros|para brisa|parabrisa|farol|farois|lanterna|lanternas|retrovisor|retrovisores|vigia|lateral|laterais|teto solar|pneu|pneus|roda|rodas|martelinho|para choque|maquina de vidro|kit gas|assistencia|carro reserva)\b/.test(
			normalized,
		);

	if (accessory) {
		return false;
	}

	return /\b(participacao obrigatoria|franquia do veiculo|normal|reduzida|facultativa)\b/.test(
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

	const explicitNoFranchise =
		/\b(nao ha franquia|sem franquia|isento de franquia|isenta de franquia|franquia isenta|franquia zerada)\b/.test(
			normalized,
		);

	return (
		explicitNoFranchise && principalVehicleCoverageLooksPrincipal(evidence)
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

		// Zero só vale quando a PRÓPRIA cobertura principal Auto/Moto declara
		// ausência de franquia. "Sem Franquia" de residência, RCF ou serviço
		// acessório nunca pode zerar a franquia principal do veículo.
		if (principalVehicleCoverageLooksPrincipal(line)) {
			return line.trim();
		}

		const previous = lines[index - 1] ?? '';
		const combined = `${previous} ${line}`.trim();

		if (principalVehicleCoverageLooksPrincipal(combined)) {
			return combined;
		}
	}

	return null;
}

function sourcePrincipalVehicleFranchise(
	sourceText: string,
): { value: number; evidence: string } | null {
	const lines = sourceText.split('\n');

	// 1) Padrões explícitos como:
	// R$ 19.172,00 (50% da Obrigatória)
	// 25% da Normal 2.629,59
	// Veículo: 2.842,61 (25 da obrigatória)
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? '';
		const normalizedLine = normalizeText(line);

		const beforePercentage = normalizedLine.match(
			/(?:r\$\s*)?(\d+(?:\.\d{3})*,\d{2})\s*\(\s*\d+(?:[.,]\d+)?\s*%\s*da\s*(?:obrigatoria|normal|basica)\s*\)/,
		);

		if (beforePercentage) {
			const value = parseBrazilianNumber(beforePercentage[1] ?? '');

			if (value !== null && value >= 0) {
				return { value, evidence: line.trim() };
			}
		}

		const afterPercentage = normalizedLine.match(
			/\d+(?:[.,]\d+)?\s*%\s*da\s*(?:obrigatoria|normal|basica)[^\d]{0,30}(\d+(?:\.\d{3})*,\d{2})/,
		);

		if (afterPercentage) {
			const value = parseBrazilianNumber(afterPercentage[1] ?? '');

			if (value !== null && value >= 0) {
				return { value, evidence: line.trim() };
			}
		}

		if (
			/\bveiculo\b/.test(normalizedLine) &&
			/\bfranquias?\b/.test(
				normalizeText(lines.slice(Math.max(0, index - 5), index + 1).join(' ')),
			)
		) {
			const afterVehicle = normalizedLine.match(
				/\bveiculo\b\s*:?\s*(?:r\$\s*)?(\d+(?:\.\d{3})*,\d{2})/,
			);

			if (afterVehicle) {
				const value = parseBrazilianNumber(afterVehicle[1] ?? '');

				if (value !== null && value >= 0) {
					return { value, evidence: line.trim() };
				}
			}
		}
	}

	// 2) Tabelas cujo cabeçalho termina em Franquia/Vl.Franquia.
	// HDI DUO, Suhai e outros layouts apresentam a franquia principal na
	// última coluna da linha de Casco/Compreensiva.
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? '';

		if (!principalVehicleCoverageLooksPrincipal(line)) {
			continue;
		}

		const header = lines
			.slice(Math.max(0, index - 10), index)
			.join(' ')
			.replace(/\s+/g, ' ')
			.trim();
		const normalizedHeader = normalizeText(header);

		const franchiseIsLastColumn =
			(/\bcoberturas? auto\b/.test(normalizedHeader) &&
				/\bfranquia\b/.test(normalizedHeader)) ||
			/\bvl franquia\b/.test(normalizedHeader) ||
			(/\bcoberturas contratadas\b/.test(normalizedHeader) &&
				/\bfranquia\b/.test(normalizedHeader) &&
				!/\bvalor do premio\b/.test(normalizedHeader));

		if (!franchiseIsLastColumn) {
			continue;
		}

		const values = numericValuesFromText(line);
		const last = values[values.length - 1];

		if (typeof last !== 'number') {
			continue;
		}

		if (last > 0) {
			return { value: last, evidence: line.trim() };
		}
	}

	// 3) Se nenhuma franquia positiva principal foi encontrada, zero só é
	// aceito quando a própria cobertura principal diz explicitamente que não há.
	const explicitNoFranchise = sourceExplicitNoPrincipalFranchise(sourceText);

	if (explicitNoFranchise) {
		return { value: 0, evidence: explicitNoFranchise };
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
		franchise: z.number('Franquia inválida').nonnegative('Franquia inválida'),
	})
	.strict();

type DataExtract = z.infer<typeof SchemaDataExtract>;

const SchemaModelNullableString = z
	.string()
	.nullish()
	.transform((value) => value ?? null);

const SchemaModelMoneyNullable = z
	.preprocess(parseBrazilianNumber, z.number().finite().nullish())
	.transform((value) => value ?? null);

const SchemaModelIntegerNullable = z
	.preprocess(parseInteger, z.number().int().nullish())
	.transform((value) => value ?? null);

const SchemaModelMoneyArray = z
	.array(z.preprocess(parseBrazilianNumber, z.number().finite()))
	.nullish()
	.transform((value) => value ?? []);

const SchemaModelNonNegativeMoneyArray = z
	.array(z.preprocess(parseBrazilianNumber, z.number().finite().nonnegative()))
	.nullish()
	.transform((value) => value ?? []);

const SchemaModelOutput = z
	.object({
		documentKind: z.enum(['proposal', 'policy', 'endorsement', 'unknown']),
		latestProposal: SchemaModelNullableString,
		renewal: z
			.boolean()
			.nullish()
			.transform((value) => value ?? null),
		renewalEvidence: SchemaModelNullableString,
		modality: z.enum(['vehicle', 'motorcycle', 'unsupported', 'unknown']),
		modalityEvidence: SchemaModelNullableString,
		insuranceCompany: z
			.object({
				index: z
					.number()
					.int()
					.min(1)
					.nullish()
					.transform((value) => value ?? null),
				basis: z
					.enum(['commercial_brand', 'legal_issuer'])
					.nullish()
					.transform((value) => value ?? null),
				evidence: SchemaModelNullableString,
			})
			.strict(),
		insured: z
			.object({
				name: SchemaModelNullableString,
				registration: SchemaModelNullableString,
				phone: SchemaModelNullableString,
				birth: SchemaModelNullableString,
				profession: SchemaModelNullableString,
				evidence: SchemaModelNullableString,
				phoneEvidence: SchemaModelNullableString,
			})
			.strict(),
		vehicle: z
			.object({
				plate: SchemaModelNullableString,
				plateStatus: z.enum(['present', 'explicitly_absent', 'unknown']),
				plateEvidence: SchemaModelNullableString,
				model: SchemaModelNullableString,
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
				overnightStayPostalCode: SchemaModelNullableString,
				driverRelation: z
					.enum(['insured', 'other', 'unknown'])
					.nullish()
					.transform((value) => value ?? 'unknown'),
				driverEvidence: z
					.string()
					.nullish()
					.transform((value) => value ?? null),
				driver: z
					.object({
						name: SchemaModelNullableString,
						cpf: z.string().nullable(),
						birth: SchemaModelNullableString,
						evidence: SchemaModelNullableString,
					})
					.strict()
					.nullable(),
			})
			.strict(),
		vigency: z
			.object({
				requestedAt: SchemaModelNullableString,
				expirationAt: SchemaModelNullableString,
				effectivedAt: SchemaModelNullableString,
				evidence: SchemaModelNullableString,
			})
			.strict(),
		financial: z
			.object({
				award: SchemaModelMoneyNullable,
				awardComponents: SchemaModelMoneyArray,
				awardEvidence: SchemaModelNullableString,
				nonLiquidCharges: SchemaModelNonNegativeMoneyArray,
				finalTotal: SchemaModelMoneyNullable,
				financialEvidence: SchemaModelNullableString,
				installments: SchemaModelIntegerNullable,
				installmentsEvidence: SchemaModelNullableString,
				franchise: SchemaModelMoneyNullable,
				franchiseEvidence: SchemaModelNullableString,
			})
			.strict(),
	})
	.strict();

type ModelOutput = z.infer<typeof SchemaModelOutput>;

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

	// Alguns layouts usam um título de questionário e, logo abaixo, uma linha
	// "Condutor / Nascimento / CPF". Mantemos esta segunda verificação curta e
	// contextual para não aceitar um CPF encontrado em cláusulas genéricas.
	return sourceContainsRegistrationNear(sourceText, registration, [
		'questionario de avaliacao de risco',
		'dados do perfil',
	]);
}

function evidenceConfirmsPrincipalDriverRegistration(
	evidence: string | null | undefined,
	registration: string,
): boolean {
	if (!evidence || !evidenceContainsRegistration(evidence, registration)) {
		return false;
	}

	const normalized = normalizeText(evidence);

	return (
		normalized.includes('condutor') ||
		normalized.includes('principal') ||
		evidenceMarksPrincipalDriverAsInsured(evidence)
	);
}

function resolvePrincipalDriver({
	vehicle,
	insured,
	sourceText,
}: {
	vehicle: ModelOutput['vehicle'];
	insured: ModelOutput['insured'];
	sourceText: string;
}): {
	name: string;
	cpf: string;
	birth: string | null;
} {
	if (!insured.name || !insured.registration) {
		throw new Error(
			'Segurado não identificado para resolver o principal condutor',
		);
	}

	const insuredCpf = parseCpfCandidate(insured.registration);
	const modelDriver = vehicle.driver;
	const modelDriverCpf = parseCpfCandidate(modelDriver?.cpf);
	const driverEvidence = vehicle.driverEvidence ?? modelDriver?.evidence;

	const sourceSaysInsured = sourceMarksPrincipalDriverAsInsured(sourceText);
	const suhaiProfileUsesInsured =
		sourceUsesSuhaiProponentProfileAsPrincipalDriver(sourceText, insuredCpf);
	const evidenceSaysInsured =
		evidenceMarksPrincipalDriverAsInsured(driverEvidence);

	const sourceConfirmsInsuredCpf = insuredCpf
		? sourceConfirmsPrincipalDriverRegistration(sourceText, insuredCpf)
		: false;

	const evidenceConfirmsInsuredCpf = insuredCpf
		? evidenceConfirmsPrincipalDriverRegistration(driverEvidence, insuredCpf)
		: false;

	const modelDriverConfirmed = modelDriverCpf
		? evidenceConfirmsPrincipalDriverRegistration(
				driverEvidence,
				modelDriverCpf,
			) || sourceConfirmsPrincipalDriverRegistration(sourceText, modelDriverCpf)
		: false;

	const modelDriverIsInsured =
		Boolean(insuredCpf && modelDriverCpf) &&
		digitsOnly(modelDriverCpf as string) === digitsOnly(insuredCpf as string);

	// A relação "segurado = principal condutor" pode ser demonstrada de várias
	// formas válidas pelo documento:
	// - "Próprio Segurado" / equivalente;
	// - o CPF do segurado repetido no campo de principal condutor;
	// - a IA retornar o mesmo CPF para o condutor e esse CPF estar confirmado
	//   no contexto de condutor pelo texto/evidência.
	if (
		sourceSaysInsured ||
		suhaiProfileUsesInsured ||
		evidenceSaysInsured ||
		sourceConfirmsInsuredCpf ||
		evidenceConfirmsInsuredCpf ||
		(modelDriverIsInsured && modelDriverConfirmed)
	) {
		if (!insuredCpf) {
			throw new Error(
				'O documento informa que o principal condutor é o próprio segurado, mas o segurado não possui CPF válido',
			);
		}

		return {
			name: insured.name,
			cpf: insuredCpf,
			birth: insured.birth ?? modelDriver?.birth ?? null,
		};
	}

	// driverRelation é um sinal da IA, não prova suficiente isoladamente.
	// Só rejeitamos aqui depois de tentar confirmar a relação diretamente no
	// texto/evidência e também comparar o CPF retornado para o condutor.
	if (vehicle.driverRelation === 'insured') {
		throw new Error(
			'A IA indicou que o principal condutor é o próprio segurado, mas o documento não permitiu confirmar essa relação',
		);
	}

	if (!modelDriver?.name || !modelDriver.cpf) {
		throw new Error('Principal condutor não identificado com segurança');
	}

	if (!modelDriverCpf) {
		throw new Error('CPF do principal condutor inválido');
	}

	if (!modelDriverConfirmed) {
		throw new Error('O documento não confirma o CPF do principal condutor');
	}

	if (insuredCpf && digitsOnly(modelDriverCpf) === digitsOnly(insuredCpf)) {
		return {
			name: insured.name,
			cpf: insuredCpf,
			birth: insured.birth ?? modelDriver.birth,
		};
	}

	return {
		name: modelDriver.name,
		cpf: modelDriverCpf,
		birth: modelDriver.birth,
	};
}

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

Exemplos de interpretação:
- "Itaú Tradicional" no cabeçalho/segmento + Porto Seguro como emissor jurídico no rodapé => escolha Itaú;
- "Azul Tradicional" no produto + Porto Seguro como emissor jurídico => escolha Azul;
- produto/marca Aliro + Yelum como sociedade jurídica => escolha Aliro;
- somente Porto como produto atual, sem outra marca comercial => escolha Porto.

"insuranceCompany.evidence" deve ser um trecho curto do documento que mostre a MARCA COMERCIAL escolhida, preferindo cabeçalho, segmento ou nome do produto. Não use somente o rodapé jurídico quando existir marca comercial distinta.
"basis" = "commercial_brand" quando houver marca comercial explícita; use "legal_issuer" somente quando o emissor jurídico também representar o produto atual e não houver outra marca comercial.

TIPO DE DOCUMENTO
- Não classifique apenas pelo título visual. Algumas seguradoras usam o título "Proposta" também para alterações contratuais.
- Se "Tipo de Operação" indicar "SUBSTITUIÇÃO DE VEÍCULO", "ALTERAÇÃO DE VEÍCULO", "TROCA DE VEÍCULO" ou cancelamento, documentKind="endorsement".
- "Proposta de Endosso de Substituição" e equivalentes também são endorsement.
- Status "Emitido" e número de apólice não transformam um endosso em proposta/apólice nova.

MODALIDADE
- carro, utilitário, SUV, pickup leve, furgão, van e utilitário comercial leve => vehicle;
- moto/motocicleta => motorcycle;
- caminhão pesado, cavalo mecânico ou outra modalidade fora do escopo => unsupported;
- categoria/tipo/modelo específico do veículo prevalece sobre "Ramo";
- categorias contendo "Motocicletas", "Motonetas", "Bicicletas Motorizadas", "SIDE-CAR" ou equivalentes => motorcycle, MESMO que o documento também diga "Ramo: Automóvel";
- "Ramo: Automóvel" pode ser um ramo comercial genérico que inclui motos em algumas seguradoras; use-o como vehicle somente quando não houver categoria/tipo/modelo mais específico;
- categoria como "Pick-ups leves" ou "Veículos de passeio" => vehicle;
- não use finalidade de uso para decidir modalidade;
- "Fretamento (carga/serviços)", entregas, uso comercial ou transporte de carga descrevem USO, não transformam automaticamente um furgão/pickup leve em caminhão.

SEGURADO E CONDUTOR
- segurado/proponente não é automaticamente o condutor;
- exceção estrutural Suhai: nas propostas SUHAI em que houver "DADOS DO PROPONENTE" + "DADOS DO PERFIL", pessoa física, o PERFIL usar idade/sexo/estado civil/utilização do proponente e NÃO existir bloco separado de principal condutor, considere o próprio proponente/segurado como principal condutor;
- use o celular do segurado, nunca telefone do corretor, banco ou terceiro;
- "vehicle.driverRelation" descreve a relação do principal condutor com o segurado:
  - "insured" quando o documento disser explicitamente "Próprio Segurado", "o próprio segurado", repetir o mesmo CPF do segurado no campo de principal condutor ou equivalente;
  - "other" quando o principal condutor for outra pessoa;
  - "unknown" somente quando realmente não for possível determinar;
- "vehicle.driverEvidence" deve ser o menor trecho que comprove quem é o principal condutor ou sua relação com o segurado;
- quando driverRelation="insured", copie nome, CPF e data de nascimento do segurado para "vehicle.driver";
- quando driverRelation="other", preencha "vehicle.driver" com nome, CPF e nascimento do principal condutor indicado no documento;
- nunca retorne driver=null apenas porque o principal condutor é o próprio segurado;
- para vehicle e motorcycle, sempre tente retornar o principal condutor resultante da contratação;
- ano do veículo = ANO MODELO quando fabricação/modelo forem diferentes.

PLACA
- "plateStatus" = "present" somente quando houver placa brasileira válida impressa;
- quando o campo visual da placa mostrar "-", "A AVISAR", "SEM PLACA", "S/ PLACA" ou equivalente, retorne "plate":null e "plateStatus":"explicitly_absent";
- NUNCA retorne "-" como valor de "plate"; use null nesses casos;
- "plateEvidence" deve transcrever o menor trecho que mostre a placa ou sua ausência explícita;
- se você apenas não conseguir localizar a placa, use "unknown", não "explicitly_absent".

CEP DE PERNOITE
- "overnightStayPostalCode" representa o CEP onde o veículo pernoita, não necessariamente o CEP cadastral do segurado;
- prefira o CEP completo de 8 dígitos quando estiver explicitamente disponível;
- alguns layouts mostram apenas um prefixo de 5 dígitos no campo de pernoite, por exemplo "Reg. Tarif./CEP Pernoite 2300 / 50630";
- nesse caso, se existir no próprio documento um ÚNICO CEP completo começando pelo mesmo prefixo, retorne esse CEP completo;
- se não existir CEP completo compatível em nenhum outro ponto do documento, retorne o prefixo de 5 dígitos exatamente como impresso; o sistema irá normalizá-lo como CEP regional preenchendo zeros à direita (ex.: 50630 -> 50630000);
- se houver mais de um CEP completo possível com o mesmo prefixo, não adivinhe: retorne somente o valor que o documento efetivamente permite identificar.

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
- Em layouts Bradesco, "Quant. Parcelas: 04" significa 4 parcelas; não confunda "1º Parcela" com a quantidade total.
- Se a tabela trouxer o cabeçalho "Parcelas" e a linha de pagamento contiver "10x", a quantidade é 10.

FRANQUIA
"franchise" = franquia PRINCIPAL do risco/veículo.
Ela pode aparecer como casco, compreensiva, básica, obrigatória, reduzida, participação obrigatória, 25% da normal, 50% da obrigatória, indenização parcial/integral do veículo ou outro nome equivalente.
Se a cobertura PRINCIPAL DO VEÍCULO declarar explicitamente "Não há franquia", "Sem franquia" ou equivalente, retorne franchise=0.
Em documentos com mais de um produto (ex.: Auto + Residencial), a franquia do Auto/Moto principal SEMPRE prevalece. Ignore franquias, "Sem Franquia" e franquias obrigatórias de Residencial, RCF, vidros, assistências ou outros produtos/coberturas secundárias.
NUNCA use 0 apenas porque o valor não foi encontrado: zero exige ausência explícita de franquia na própria cobertura principal do veículo.
Normalmente está associada à primeira cobertura principal, mas confirme pela estrutura da tabela.
NUNCA use franquia de vidro, para-brisa, farol, lanterna, retrovisor, roda, pneu, assistência ou outro serviço acessório.
NUNCA confunda a franquia com o prêmio da cobertura na coluna ao lado.
"franchiseEvidence" deve conter o trecho da cobertura/franquia principal e seu valor, ou o trecho explícito de ausência de franquia.

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
  "vehicle":{"plate":"string|null","plateStatus":"present|explicitly_absent|unknown","plateEvidence":"string|null","model":"string|null","year":2026,"usage":"leisure_and_work|leisure|client_supplier_visits|app_based_transport|taxi|public_transportation|delivieries|tourism|null","overnightStayPostalCode":"string|null","driverRelation":"insured|other|unknown","driverEvidence":"string|null","driver":{"name":"string|null","cpf":"string|null","birth":"DD/MM/AAAA|null","evidence":"string|null"}|null},
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

function sourceLooksLikeEndorsementAdjustment(sourceText: string): boolean {
	const normalized = normalizeText(sourceText);

	const hasExplicitEndorsementOperation =
		/\btipo de operacao.{0,140}(substituicao de veiculo|alteracao de veiculo|troca de veiculo|cancelamento)\b/.test(
			normalized,
		) ||
		/\bproposta de endosso de substituicao\b/.test(normalized) ||
		/\bendosso de substituicao(?: de)? veiculo\b/.test(normalized);

	if (hasExplicitEndorsementOperation) {
		return true;
	}

	const hasNegativeLiquid =
		/(?:pre[cç]o|pr[eê]mio|valor)\s+l[ií]quido(?:\s+total)?\s*:?\s*R?\$?\s*-\s*\d/i.test(
			sourceText,
		);

	const hasCreditOrRefund =
		/\b(credito em conta|restituicao|estorno|devolucao|a restituir)\b/.test(
			normalized,
		);

	const vehicleChanged =
		/\bveiculo igual ao anterior nao\b/.test(normalized) ||
		/\b(substituicao|troca|alteracao) de veiculo\b/.test(normalized);

	const hasPolicyContext =
		/\b(apolice anterior|numero apolice|n apolice anterior|vigencia)\b/.test(
			normalized,
		);

	// Algumas seguradoras geram alterações/endossos usando um layout cujo título
	// continua sendo "Proposta". Um prêmio líquido global negativo, especialmente
	// acompanhado de crédito/restituição e mudança de veículo, não representa o
	// prêmio de uma nova proposta/apólice: é efeito financeiro de uma alteração.
	return (
		hasNegativeLiquid &&
		hasPolicyContext &&
		(hasCreditOrRefund || vehicleChanged)
	);
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
	const calculated = liquid + sum(charges);
	const difference = Math.abs(calculated - total);

	if (difference <= MONEY_TOLERANCE) {
		return;
	}

	const sourceConfirmsAllValues =
		financialEvidenceContainsValue(null, sourceText, liquid) &&
		charges.every((charge) =>
			financialEvidenceContainsValue(null, sourceText, charge),
		) &&
		financialEvidenceContainsValue(null, sourceText, total);

	// Algumas seguradoras imprimem líquido, juros, IOF e total com uma pequena
	// diferença residual de centavos decorrente do rateio/arredondamento interno.
	// Quando TODOS os valores estão explicitamente confirmados no documento,
	// não transformamos uma diferença residual <= R$ 0,10 em falso 409.
	if (
		sourceConfirmsAllValues &&
		difference <= DOCUMENT_FINANCIAL_RECONCILIATION_TOLERANCE
	) {
		console.warn(
			`[extract-pdf:v42] diferença residual no fechamento financeiro: calculado=${calculated.toFixed(
				2,
			)} total=${total.toFixed(2)} diferença=${difference.toFixed(2)}`,
		);
		return;
	}

	throw new Error(message);
}

function validateFinancial(raw: ModelOutput['financial'], sourceText: string) {
	if (raw.award === null || raw.award <= 0) {
		throw new Error(
			'Não foi possível determinar o prêmio líquido com segurança',
		);
	}

	if (raw.awardComponents.length) {
		assertClose(
			sum(raw.awardComponents),
			raw.award,
			'Os componentes do prêmio líquido não fecham com o prêmio líquido informado',
		);

		for (const component of raw.awardComponents) {
			if (
				!financialEvidenceContainsValue(
					raw.awardEvidence,
					sourceText,
					component,
				)
			) {
				throw new Error(
					'O documento não confirma todos os componentes do prêmio líquido',
				);
			}
		}
	} else if (
		!financialEvidenceContainsValue(raw.awardEvidence, sourceText, raw.award)
	) {
		throw new Error('O documento não confirma o prêmio líquido');
	}

	if (raw.finalTotal !== null) {
		if (
			!financialEvidenceContainsValue(
				raw.financialEvidence,
				sourceText,
				raw.finalTotal,
			)
		) {
			throw new Error('O documento não confirma o valor total da contratação');
		}

		for (const charge of raw.nonLiquidCharges) {
			if (
				!financialEvidenceContainsValue(
					raw.financialEvidence,
					sourceText,
					charge,
				)
			) {
				throw new Error(
					'O documento não confirma todos os encargos financeiros',
				);
			}
		}

		assertDocumentFinancialReconciliation({
			liquid: raw.award,
			charges: raw.nonLiquidCharges,
			total: raw.finalTotal,
			sourceText,
			message:
				'Prêmio líquido, encargos e total final são matematicamente inconsistentes',
		});
	}

	const installments = resolveInstallments(raw, sourceText);

	const sourceFranchise = sourcePrincipalVehicleFranchise(sourceText);

	let resolvedFranchise = raw.franchise;
	let franchiseEvidence = raw.franchiseEvidence;

	if (sourceFranchise) {
		resolvedFranchise = sourceFranchise.value;
		franchiseEvidence = sourceFranchise.evidence;
	}

	if (resolvedFranchise === null || resolvedFranchise < 0) {
		throw new Error('Não foi possível determinar a franquia principal');
	}

	if (!franchiseEvidence) {
		throw new Error('Franquia principal identificada sem evidência');
	}

	if (!franchiseEvidenceConfirmsValue(franchiseEvidence, resolvedFranchise)) {
		throw new Error('A evidência não confirma a franquia principal');
	}

	if (
		!franchiseEvidenceLooksPrincipal(franchiseEvidence) &&
		!(
			resolvedFranchise > 0 &&
			sourceSupportsPrincipalFranchise(sourceText, resolvedFranchise)
		)
	) {
		throw new Error(
			'A evidência da franquia não permite confirmar que seja a franquia principal',
		);
	}

	return {
		award: raw.award,
		installments,
		franchise: resolvedFranchise,
	};
}

function finalizeModelOutput(
	raw: ModelOutput,
	insuranceCompanies: Array<InsuranceCompanyRow>,
	sourceText: string,
): DataExtract {
	if (
		raw.documentKind === 'endorsement' ||
		sourceLooksLikeEndorsementAdjustment(sourceText)
	) {
		throw new Error(
			'O documento enviado é um endosso/alteração, não uma proposta/apólice',
		);
	}

	if (raw.documentKind === 'unknown') {
		throw new Error(
			'Não foi possível identificar o tipo do documento com segurança',
		);
	}

	const resolvedModality = resolveSupportedModality(
		raw.modality,
		raw.modalityEvidence,
		sourceText,
	);

	if (!resolvedModality) {
		throw new Error(
			'Modalidade não suportada ou não identificada com segurança',
		);
	}

	if (raw.renewal === null || !raw.renewalEvidence) {
		throw new Error(
			'Não foi possível determinar se o seguro é novo ou renovação',
		);
	}

	const company = resolveInsuranceCompany(
		raw.insuranceCompany,
		insuranceCompanies,
		sourceText,
	);

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

	if (!vehicle.model || vehicle.year === null || !vehicle.usage) {
		throw new Error('Dados do veículo incompletos ou ambíguos');
	}

	const plate = resolveVehiclePlate(vehicle, sourceText);
	const overnightStayPostalCode = resolveOvernightStayPostalCode(
		vehicle.overnightStayPostalCode,
		sourceText,
	);

	const driver = resolvePrincipalDriver({
		vehicle,
		insured,
		sourceText,
	});

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
		modality: resolvedModality.modality,
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
			overnightStayPostalCode,
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

	const insuredBirthPromise = valid.insured.birth
		? Promise.resolve(valid.insured.birth)
		: insuredIsPerson
			? lookupCPF(valid.insured.registration)
			: Promise.resolve(null);

	const driverBirthPromise = valid.vehicle.driver.birth
		? Promise.resolve(valid.vehicle.driver.birth)
		: driverIsInsured
			? Promise.resolve(null)
			: lookupCPF(valid.vehicle.driver.cpf);

	const [insuredBirth, driverBirth] = await Promise.all([
		insuredBirthPromise,
		driverBirthPromise,
	]);

	valid.insured.birth = insuredBirth ?? null;
	valid.vehicle.driver.birth = driverIsInsured
		? valid.insured.birth
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
		`[extract-pdf:v42] consultas de nascimento ${Math.round(performance.now() - lookupStarted)}ms`,
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
				const cacheKey = `pdf-extract:v42:${hash}`;
				const cached = await ctx.cache.get(cacheKey);

				console.log(
					`[extract-pdf:v42] hash=${hash} cache=${cached ? 'hit' : 'miss'}`,
				);

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
