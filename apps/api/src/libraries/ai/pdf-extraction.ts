import { isPlate } from '@segwise/core';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';
import { z } from 'zod';
import { renderPdfPages } from '@/libraries/pdf/render-pages';

const AI_BASE_URL = process.env.AI_BASE_URL as string;
const AI_API_KEY = process.env.AI_API_KEY as string;
const AI_MODEL = process.env.AI_MODEL as string;
const AI_MODEL_VISION = (process.env.AI_MODEL_VISION || AI_MODEL) as string;

const REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 45_000);
const MAX_TEXT_CHARS = Number(process.env.AI_MAX_TEXT_CHARS ?? 80_000);
const MAX_COMPLETION_TOKENS = Number(
	process.env.AI_MAX_COMPLETION_TOKENS ?? 2_200,
);

const client = new OpenAI({
	baseURL: AI_BASE_URL,
	apiKey: AI_API_KEY,
	timeout: REQUEST_TIMEOUT_MS,
});

class AIProviderError extends Error {
	readonly status?: number;

	constructor(message: string, status?: number) {
		super(message);
		this.name = 'AIProviderError';
		this.status = status;
	}
}

const SchemaPlateLenient = z
	.string()
	.nullish()
	.transform((value) => {
		const plate = value?.trim().toLowerCase().replace(/[\s-]/g, '');

		return plate && isPlate(plate) ? plate : null;
	});

function sanitizeText(text: string): string {
	return (
		text
			// biome-ignore lint/suspicious/noControlCharactersInRegex: false positive
			.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
			.replace(/\r\n/g, '\n')
			.replace(/\n{3,}/g, '\n\n')
			.replace(/[ \t]{3,}/g, '  ')
			.trim()
	);
}

const DATA_PATTERNS = [
	/\d{3}\.\d{3}\.\d{3}-\d{2}/g,
	/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g,
	/\d{2}\/\d{2}\/\d{4}/g,
	/R\$\s?\d/g,
	/\b\d{5}-?\d{3}\b/g,
];

const IMPORTANT_PATTERNS = [
	/pr[eê]mio/gi,
	/pre[cç]o\s+l[ií]quido/gi,
	/valor\s+l[ií]quido/gi,
	/franquia/gi,
	/forma\s+de\s+pagamento/gi,
	/parcel/gi,
	/dados\s+do\s+ve[ií]culo/gi,
	/principal\s+condutor/gi,
	/dados\s+do\s+(?:proponente|segurado)/gi,
	/vig[eê]ncia/gi,
	/endosso/gi,
	/seguradora/gi,
	/cnpj/gi,
	/ap[oó]lice\s+anterior/gi,
	/renova/gi,
	/cong[eê]nere/gi,
	/tipo\s+de\s+opera[cç][aã]o/gi,
];

function pageScore(page: string): number {
	const dataScore = DATA_PATTERNS.reduce(
		(total, pattern) => total + (page.match(pattern)?.length ?? 0),
		0,
	);

	const semanticScore = IMPORTANT_PATTERNS.reduce(
		(total, pattern) => total + (page.match(pattern)?.length ?? 0) * 3,
		0,
	);

	return dataScore + semanticScore;
}

function pageBlock(text: string, index: number): string {
	return `===== PÁGINA ${index + 1} =====\n${text}`;
}

function buildPromptText(
	pages: Array<string>,
	maxChars = MAX_TEXT_CHARS,
): string {
	if (!pages.length) {
		return '';
	}

	const blocks = pages.map((text, index) => pageBlock(text, index));
	const fullText = blocks.join('\n\n');

	if (fullText.length <= maxChars) {
		return fullText;
	}

	const selected = new Set<number>();
	selected.add(0);
	selected.add(pages.length - 1);

	const ranked = pages
		.map((text, index) => ({ index, score: pageScore(text) }))
		.sort((a, b) => b.score - a.score || a.index - b.index);

	for (const { index } of ranked) {
		selected.add(index);

		const candidate = [...selected]
			.sort((a, b) => a - b)
			.map((pageIndex) => blocks[pageIndex])
			.join('\n\n');

		if (candidate.length > maxChars) {
			selected.delete(index);
		}
	}

	const compact = [...selected]
		.sort((a, b) => a - b)
		.map((index) => blocks[index])
		.join('\n\n');

	if (compact.length <= maxChars) {
		return compact;
	}

	return compact.slice(0, maxChars);
}

function visionInstructions(imagesCount: number): string {
	if (!imagesCount) {
		return '';
	}

	return `
O PDF também foi renderizado em ${imagesCount} imagem(ns), na mesma ordem das páginas.
Use TEXTO e IMAGENS em conjunto:
- o texto extraído ajuda com caracteres exatos como CPF, CNPJ, placa, CEP, datas e valores;
- as imagens são a principal referência para estrutura visual, tabelas, colunas, títulos, campos marcados e associação entre rótulo e valor;
- quando a linearização do texto misturar colunas, use a imagem para decidir a associação correta;
- quando houver divergência entre texto e imagem, confira visualmente a página e use o valor que estiver efetivamente impresso;
- se o PDF for escaneado e o texto estiver vazio ou incompleto, leia os dados diretamente das imagens;
- analise o documento inteiro antes de responder.
`;
}

async function askJson({
	model,
	prompt,
	images,
}: {
	model: string;
	prompt: string;
	images: Array<string>;
}): Promise<unknown> {
	let response: Awaited<ReturnType<typeof client.chat.completions.create>>;

	try {
		response = await client.chat.completions.create({
			model,
			max_tokens: MAX_COMPLETION_TOKENS,
			temperature: 0,
			messages: [
				{
					role: 'system',
					content:
						'Você é um extrator de dados de seguros extremamente rigoroso. Responda APENAS com um objeto JSON válido no formato solicitado. Nunca invente dados e nunca escolha um valor quando houver ambiguidade real.',
				},
				{
					role: 'user',
					content: [
						{ type: 'text', text: prompt },
						...images.map((url) => ({
							type: 'image_url' as const,
							image_url: { url },
						})),
					],
				},
			],
		});
	} catch (error) {
		if (error instanceof OpenAI.APIError) {
			throw new AIProviderError(
				`Falha no provedor de IA${error.status ? ` (${error.status})` : ''}: ${error.message}`,
				error.status,
			);
		}

		throw error;
	}

	console.log(
		`[ai] ${model} tokens entrada=${response.usage?.prompt_tokens ?? 'n/a'} saída=${response.usage?.completion_tokens ?? 'n/a'} imagens=${images.length}`,
	);

	const textResult = response.choices[0]?.message.content;

	if (!textResult) {
		throw new Error('Modelo retornou resposta vazia.');
	}

	const normalized = textResult
		.trim()
		.replace(/^```json\s*/i, '')
		.replace(/^```\s*/i, '')
		.replace(/```\s*$/i, '');

	try {
		return JSON.parse(normalized);
	} catch {
		throw new Error('Modelo retornou JSON inválido.');
	}
}

async function runPdfExtraction<T>({
	label,
	buffer,
	ask,
}: {
	label: string;
	buffer: ArrayBuffer;
	ask: (input: {
		model: string;
		text: string;
		images: Array<string>;
	}) => Promise<T>;
}): Promise<T> {
	const timings: Record<string, number> = {};
	const startedAt = performance.now();
	const lap = (name: string, since: number) => {
		timings[name] = Math.round(performance.now() - since);
	};

	const textStarted = performance.now();
	const parser = new PDFParse({ data: Buffer.from(buffer) });
	let pages: Array<string> = [];

	try {
		pages = (await parser.getText()).pages.map((page) =>
			sanitizeText(page.text),
		);
	} catch (error) {
		console.warn(
			`[${label}] não foi possível extrair texto do PDF; seguindo com visão:`,
			error instanceof Error ? error.message : error,
		);
	} finally {
		await parser.destroy().catch(() => {});
	}

	lap('text', textStarted);

	const promptText = buildPromptText(pages);

	const renderStarted = performance.now();
	const images = await renderPdfPages(buffer);
	lap('render', renderStarted);

	if (!images.length) {
		throw new Error(
			'Não foi possível renderizar as páginas do PDF para validação visual.',
		);
	}

	const modelStarted = performance.now();
	const data = await ask({
		model: AI_MODEL_VISION,
		text: promptText,
		images,
	});
	lap('model', modelStarted);
	lap('total', startedAt);

	console.log(
		`[${label}] ok modo=vision aiCalls=1 paginas=${images.length} charsTexto=${promptText.length} ${JSON.stringify(timings)}`,
	);

	return data;
}

export {
	AIProviderError,
	askJson,
	runPdfExtraction,
	SchemaPlateLenient,
	visionInstructions,
};
