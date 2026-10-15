interface FipeCandidate {
	similaridade: string;
	correspondencia: string;
	marca: string;
	modelo: string;
	ano_modelo: number;
	codigo_fipe: string;
	codigo_marca: string;
	codigo_modelo: string;
	mes_referencia: string;
	combustivel: string;
	valor: string;
	desvalorizometro: string;
	unidade_valor: string;
}

interface ScoredCandidate extends FipeCandidate {
	score: number;
	matchedSignals: string[];
}

const KNOWN_TRIMS = [
	'XLS',
	'XLE',
	'XEI',
	'GLX',
	'GLS',
	'GLI',
	'LTZ',
	'LTZ+',
	'PREMIER',
	'PLATINUM',
	'HIGHLINE',
	'COMFORTLINE',
	'TRENDLINE',
	'XL',
	'XS',
	'XE',
	'LX',
	'LS',
	'LT',
	'SE',
	'SV',
	'SR',
	'SEL',
	'TITANIUM',
	'FREESTYLE',
];

const BODY_CODE_MAP: Record<string, 'hatch' | 'sedan' | 'suv'> = {
	HA: 'hatch',
	HB: 'hatch',
	SD: 'sedan',
	SED: 'sedan',
	SW: 'suv',
};

function normalize(text: string): string {
	return text
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toUpperCase();
}

function tokenize(text: string): string[] {
	return normalize(text)
		.split(/[^A-Z0-9+]+/)
		.filter(Boolean);
}

function extractSourceSignals(modeloDetran: string): {
	trim: string | null;
	body: 'hatch' | 'sedan' | 'suv' | null;
	rawTokens: string[];
} {
	const tokens = tokenize(modeloDetran);

	let body: 'hatch' | 'sedan' | 'suv' | null = null;

	for (const token of tokens) {
		if (BODY_CODE_MAP[token]) {
			body = BODY_CODE_MAP[token];

			break;
		}
	}

	let trim: string | null = null;

	for (const knownTrim of KNOWN_TRIMS) {
		const found = tokens.some(
			(token) => token === knownTrim || token.startsWith(knownTrim),
		);

		if (found) {
			trim = knownTrim;

			break;
		}
	}

	return { trim, body, rawTokens: tokens };
}

function extractCandidateSignals(modeloFipe: string): {
	trim: string | null;
	body: 'hatch' | 'sedan' | 'suv' | null;
	doors: number | null;
} {
	const tokens = tokenize(modeloFipe);

	let body: 'hatch' | 'sedan' | 'suv' | null = null;

	if (tokens.includes('SEDAN') || tokens.includes('SD')) {
		body = 'sedan';
	} else if (tokens.includes('SW') || tokens.includes('WAGON')) {
		body = 'suv';
	}

	let doors: number | null = null;

	for (const token of tokens) {
		const match = token.match(/^(\d)P$/);

		if (match) {
			doors = Number(match[1]);

			break;
		}
	}

	if (body === null && doors === 5) {
		body = 'hatch';
	}
	if (body === null && doors === 4) {
		body = 'sedan';
	}

	let trim: string | null = null;

	for (const knownTrim of KNOWN_TRIMS) {
		if (tokens.includes(knownTrim)) {
			trim = knownTrim;

			break;
		}
	}

	return { trim, body, doors };
}

const WEIGHTS = {
	trimMatch: 50,
	bodyMatch: 30,
	similaridadeMax: 20,
};

const MIN_CONFIDENT_SCORE = 50;

function rankFipeCandidates(
	modeloDetran: string,
	candidates: FipeCandidate[],
): { ranked: ScoredCandidate[]; strategy: 'structural' | 'fallback' } {
	const source = extractSourceSignals(modeloDetran);

	const scored: ScoredCandidate[] = candidates.map((candidate) => {
		const target = extractCandidateSignals(candidate.modelo);

		const matchedSignals: string[] = [];

		let score = 0;

		if (source.trim && target.trim && source.trim === target.trim) {
			score += WEIGHTS.trimMatch;

			matchedSignals.push(`trim:${source.trim}`);
		}

		if (source.body && target.body && source.body === target.body) {
			score += WEIGHTS.bodyMatch;

			matchedSignals.push(`body:${source.body}`);
		}

		const similaridadeNum = Number.parseFloat(candidate.similaridade) || 0;

		score += (similaridadeNum / 100) * WEIGHTS.similaridadeMax;

		return { ...candidate, score, matchedSignals };
	});

	scored.sort((a, b) => b.score - a.score);

	const best = scored[0];

	const strategy: 'structural' | 'fallback' =
		best && best.score >= MIN_CONFIDENT_SCORE && best.matchedSignals.length > 0
			? 'structural'
			: 'fallback';

	if (strategy === 'fallback') {
		const bySimilaridade = [...candidates].sort(
			(a, b) =>
				(Number.parseFloat(b.similaridade) || 0) -
				(Number.parseFloat(a.similaridade) || 0),
		);

		return {
			ranked: bySimilaridade.map((c) => ({
				...c,
				score: Number.parseFloat(c.similaridade) || 0,
				matchedSignals: ['fallback:similaridade'],
			})),
			strategy: 'fallback',
		};
	}

	return { ranked: scored, strategy };
}

export { type FipeCandidate, type ScoredCandidate, rankFipeCandidates };
