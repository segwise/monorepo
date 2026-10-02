import { isPlate } from '@segwise/core';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';
import { z } from 'zod';
import { renderPdfPages } from '@/libraries/pdf/render-pages';

const AI_BASE_URL = process.env.AI_BASE_URL as string;
const AI_API_KEY = process.env.AI_API_KEY as string;
// Modelo das etapas só com texto (o caminho rápido, que atende quase tudo).
const AI_MODEL = process.env.AI_MODEL as string;
// Modelo das etapas com imagem: precisa ter visão. Padrão: o mesmo AI_MODEL.
const AI_MODEL_VISION = (process.env.AI_MODEL_VISION || AI_MODEL) as string;

// 'fallback' (padrão): começa só com texto e usa as imagens se não bastar.
// 'always': sempre texto + imagens. 'off': nunca usa imagens.
const VISION_MODE = (process.env.AI_VISION_MODE ?? 'fallback') as
	| 'fallback'
	| 'always'
	| 'off';

// Os dados de proposta/apólice/endosso ficam em poucas páginas; o resto são
// cláusulas gerais. A primeira tentativa envia só o texto das páginas com mais
// dados (ver pickDataPages).
const FAST_TEXT_PAGES = Number(process.env.AI_TEXT_PAGES ?? 3);

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30_000;
const MIN_TEXT_CHARS = 50;
const MAX_TEXT_CHARS = 24_000;

const client = new OpenAI({
	baseURL: AI_BASE_URL,
	apiKey: AI_API_KEY,
	timeout: REQUEST_TIMEOUT_MS,
});

// Documentos às vezes trazem texto no lugar da placa (ex.: "A AVISAR" em veículo
// zero km). Placa fora do padrão não invalida a extração: vira null.
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
			// biome-ignore lint/suspicious/noControlCharactersInRegex: regex
			.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
			.replace(/\r\n/g, '\n')
			.replace(/\n{3,}/g, '\n\n')
			// Menos tokens no prompt sem perder a ordem das colunas.
			.replace(/[ \t]{3,}/g, '  ')
	);
}

// Páginas com dados (CPF, CNPJ, datas, valores em R$, CEP) pontuam alto; páginas
// de cláusulas gerais quase não têm esses padrões.
const DATA_PATTERNS = [
	/\d{3}\.\d{3}\.\d{3}-\d{2}/g,
	/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g,
	/\d{2}\/\d{2}\/\d{4}/g,
	/R\$\s?\d/g,
	/\b\d{5}-?\d{3}\b/g,
];

function dataScore(page: string) {
	return DATA_PATTERNS.reduce(
		(total, pattern) => total + (page.match(pattern)?.length ?? 0),
		0,
	);
}

// As `count` páginas mais ricas em dados, na ordem original do documento. A
// primeira página entra sempre (identifica seguradora e segurado).
function pickDataPages(pages: Array<string>, count: number): Array<string> {
	if (pages.length <= count) {
		return pages;
	}

	const ranked = pages
		.map((text, index) => ({ index, score: dataScore(text) }))
		.slice(1)
		.sort((a, b) => b.score - a.score || a.index - b.index)
		.slice(0, count - 1)
		.map((page) => page.index);

	return [0, ...ranked]
		.sort((a, b) => a - b)
		.map((index) => pages[index] as string);
}

function chunkText(text: string, maxChars = MAX_TEXT_CHARS): string {
	return text.length <= maxChars ? text : text.slice(0, maxChars);
}

// Trecho de prompt que explica ao modelo como usar texto e imagens juntos.
function visionInstructions(imagesCount: number): string {
	if (!imagesCount) {
		return '';
	}

	return `
		O documento também está anexado como ${imagesCount} imagem(ns) das primeiras páginas, na ordem. Use as duas fontes juntas:
		- O texto extraído é a fonte para os caracteres exatos (CPF, CNPJ, códigos, placa, valores).
		- As imagens são a fonte para a estrutura: tabelas, a qual coluna ou título cada valor pertence (ex.: prêmio da cobertura x franquia), campos marcados e o layout da página. Use-as para desambiguar e para achar o que o texto não trouxe.
		- Se o texto e a imagem divergirem em um valor, confirme visualmente na imagem qual está certo.
		- Se o texto estiver vazio ou ilegível (documento escaneado), leia tudo pelas imagens.
`;
}

// Só vale tentar de novo o que pode passar sozinho: rede, timeout, 408/409/429
// e 5xx. 400/401/403/404 (modelo inválido, chave errada) não melhoram.
function isTransient(error: unknown) {
	if (!(error instanceof OpenAI.APIError)) {
		return true;
	}

	const status = error.status;

	return !status || status >= 500 || [408, 409, 429].includes(status);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Uma chamada ao modelo: texto (+ imagens) em, JSON em objeto. A validação com
// Zod fica com quem chama (um ZodError faz a extração escalar de etapa).
async function askJson({
	model,
	prompt,
	images,
}: {
	model: string;
	prompt: string;
	images: Array<string>;
}): Promise<unknown> {
	const response = await client.chat.completions.create({
		model,
		max_tokens: 1500,
		temperature: 0,
		messages: [
			{
				role: 'system',
				content:
					'Você é um extrator de dados cirúrgico e preciso. Responda APENAS com um objeto JSON válido que segue exatamente o schema pedido, sem markdown, sem texto fora do JSON.',
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

	console.log(
		`[ai] ${model} tokens entrada=${response.usage?.prompt_tokens} saída=${response.usage?.completion_tokens} imagens=${images.length}`,
	);

	const textResult = response.choices[0]?.message.content;

	if (!textResult) {
		throw new Error('Modelo retornou resposta vazia.');
	}

	return JSON.parse(
		textResult
			.trim()
			.replace(/^```json\s*/i, '')
			.replace(/^```\s*/i, '')
			.replace(/```\s*$/i, ''),
	);
}

type Step = { name: string; text: string; vision: boolean };

// Orquestra a extração de um PDF, da etapa mais rápida para a mais completa:
// 1. `text-fast`: texto das primeiras páginas;
// 2. `text-full`: texto de todas as páginas (se houver mais);
// 3. `vision`: texto + imagens das primeiras páginas (também para PDF escaneado).
// `ask` recebe o texto e as imagens da etapa e devolve o dado já validado; um
// z.ZodError passa para a próxima etapa em vez de repetir o mesmo prompt.
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
	let pages: Array<string>;

	try {
		pages = (await parser.getText()).pages.map((page) =>
			sanitizeText(page.text),
		);
	} finally {
		await parser.destroy().catch(() => {});
	}

	lap('text', textStarted);

	const fastText = pickDataPages(pages, FAST_TEXT_PAGES).join('\n\n');
	const fullText = pages.join('\n\n');
	const hasText = fastText.trim().length >= MIN_TEXT_CHARS;
	const hasMorePages = pages.length > FAST_TEXT_PAGES;

	// Resposta inválida (ex.: dado obrigatório numa página que ficou de fora)
	// passa para a próxima etapa.
	const steps: Array<Step> =
		VISION_MODE === 'always'
			? [{ name: 'vision', text: fullText, vision: true }]
			: !hasText
				? VISION_MODE === 'off'
					? []
					: [{ name: 'vision', text: fullText, vision: true }]
				: [
						{ name: 'text-fast', text: fastText, vision: false },
						...(hasMorePages
							? [{ name: 'text-full', text: fullText, vision: false }]
							: []),
						...(VISION_MODE === 'fallback'
							? [{ name: 'vision', text: fullText, vision: true }]
							: []),
					];

	let images: Array<string> | null = null;
	let lastError: unknown;
	let attempts = 0;

	for (const step of steps) {
		let stepImages: Array<string> = [];

		if (step.vision) {
			const renderStarted = performance.now();

			images ??= await renderPdfPages(buffer);
			stepImages = images;
			lap('render', renderStarted);

			// Sem imagem não há o que a visão acrescente.
			if (!stepImages.length) {
				continue;
			}
		}

		for (let retry = 1; retry <= MAX_RETRIES; retry++) {
			attempts += 1;

			try {
				const modelStarted = performance.now();

				const data = await ask({
					model: step.vision ? AI_MODEL_VISION : AI_MODEL,
					text: chunkText(step.text),
					images: stepImages,
				});

				lap(`model-${step.name}`, modelStarted);
				lap('total', startedAt);

				console.log(
					`[${label}] ok etapa=${step.name} tentativas=${attempts} ${JSON.stringify(timings)}`,
				);

				return data;
			} catch (error) {
				lastError = error;

				// Repetir o mesmo prompt quase sempre dá o mesmo resultado.
				if (error instanceof z.ZodError) {
					console.warn(
						`[${label}] resposta inválida na etapa ${step.name}: ${error.issues
							.map((issue) => `${issue.path.join('.')} (${issue.message})`)
							.join('; ')}`,
					);

					break;
				}

				// Erro que não passa tentando de novo (modelo inválido, chave
				// errada, imagens recusadas): na etapa de imagem só encerra a
				// etapa; nas de texto o mesmo erro se repetiria, então falha já.
				if (!isTransient(error)) {
					const status =
						error instanceof OpenAI.APIError ? error.status : undefined;

					console.warn(
						`[${label}] erro ${status} sem retentativa na etapa ${step.name}`,
					);

					if (step.vision) {
						break;
					}

					throw new Error(
						`Falha ao consultar o modelo de IA (${status}): ${(error as Error).message}`,
					);
				}

				if (retry < MAX_RETRIES) {
					await sleep(1000 * retry);
				}
			}
		}
	}

	if (!hasText && !images?.length) {
		throw new Error(
			'PDF não retornou texto extraível nem páginas como imagem — não foi possível ler o documento.',
		);
	}

	console.warn(`[${label}] falhou ${JSON.stringify(timings)}`);

	throw new Error(
		`Falha ao extrair dados válidos após ${attempts} tentativa(s). Último erro: ${lastError}`,
	);
}

export { askJson, runPdfExtraction, SchemaPlateLenient, visionInstructions };
