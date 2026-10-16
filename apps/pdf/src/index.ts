import { timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage } from 'node:http';
import { z } from 'zod';
import {
	BusyError,
	isBrowserReady,
	RenderTimeoutError,
	renderPdf,
	shutdown,
} from './render.ts';

const PORT = Number(process.env.PORT ?? 3000);
const TOKEN = process.env.PDF_TOKEN ?? '';
const VERSION = process.env.APP_VERSION ?? 'unknown';
// O HTML de um relatório grande (sem teto de linhas na api) chega a alguns MB.
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES ?? 20 * 1024 * 1024);

if (process.env.NODE_ENV === 'production' && TOKEN.length < 16) {
	console.error('PDF_TOKEN (mínimo 16 caracteres) é obrigatório em produção.');
	process.exit(1);
}

const cssLength = z
	.string()
	.regex(/^\d+(\.\d+)?(px|in|cm|mm)$/)
	.optional();

const requestSchema = z.object({
	html: z.string().min(1),
	options: z
		.object({
			format: z.enum(['A4', 'Letter']).default('A4'),
			printBackground: z.boolean().default(true),
			margin: z
				.object({
					top: cssLength,
					right: cssLength,
					bottom: cssLength,
					left: cssLength,
				})
				.strict()
				.optional(),
			pageRanges: z
				.string()
				.regex(/^[0-9, -]{1,40}$/)
				.optional(),
			timeoutMs: z.number().int().min(1000).max(120_000).default(30_000),
		})
		.strict()
		.default({
			format: 'A4',
			printBackground: true,
			timeoutMs: 30_000,
		}),
});

class PayloadTooLargeError extends Error {}

async function readBody(request: IncomingMessage) {
	const chunks: Buffer[] = [];
	let size = 0;

	for await (const chunk of request) {
		size += chunk.length;

		if (size > MAX_BODY_BYTES) throw new PayloadTooLargeError();

		chunks.push(chunk);
	}

	return Buffer.concat(chunks).toString('utf8');
}

function isAuthorized(request: IncomingMessage) {
	if (!TOKEN) return true; // só em desenvolvimento (em produção o boot exige o token)

	const received = Buffer.from(request.headers.authorization ?? '');
	const expected = Buffer.from(`Bearer ${TOKEN}`);

	return (
		received.length === expected.length && timingSafeEqual(received, expected)
	);
}

const server = createServer(async (request, response) => {
	const started = performance.now();
	const url = new URL(request.url ?? '/', 'http://localhost');

	function send(
		status: number,
		body: string | Uint8Array,
		type: string,
		headers = {},
	) {
		response.writeHead(status, {
			'Content-Type': type,
			'X-App-Version': VERSION,
			...headers,
		});
		response.end(body);
	}

	function json(status: number, body: object, headers = {}) {
		send(status, JSON.stringify(body), 'application/json', headers);
	}

	try {
		if (request.method === 'GET' && url.pathname === '/health') {
			return (await isBrowserReady())
				? json(200, { status: 'ok' })
				: json(503, { status: 'browser indisponível' });
		}

		if (request.method !== 'POST' || url.pathname !== '/render') {
			return json(404, { message: 'Não encontrado' });
		}

		if (!isAuthorized(request)) {
			return json(401, { message: 'Não autorizado' });
		}

		const parsed = requestSchema.safeParse(
			JSON.parse((await readBody(request)) || 'null'),
		);

		if (!parsed.success) {
			// Nunca devolve nem registra o HTML: só o caminho e o motivo de cada campo inválido.
			return json(400, {
				message: 'Requisição inválida',
				issues: parsed.error.issues.map((issue) => ({
					path: issue.path.join('.'),
					message: issue.message,
				})),
			});
		}

		const pdf = await renderPdf(parsed.data.html, parsed.data.options);

		console.log(
			JSON.stringify({
				route: 'render',
				status: 200,
				bytes: pdf.length,
				ms: Math.round(performance.now() - started),
			}),
		);

		return send(200, pdf, 'application/pdf');
	} catch (error) {
		const status =
			error instanceof PayloadTooLargeError
				? 413
				: error instanceof SyntaxError
					? 400
					: error instanceof BusyError
						? 503
						: error instanceof RenderTimeoutError
							? 504
							: 500;

		console.error(
			JSON.stringify({
				route: url.pathname,
				status,
				ms: Math.round(performance.now() - started),
				error: error instanceof Error ? error.message.split('\n')[0] : 'erro',
			}),
		);

		if (response.headersSent) return response.destroy();

		return json(
			status,
			{
				message:
					status === 500 ? 'Erro ao gerar PDF' : (error as Error).message,
			},
			status === 503 ? { 'Retry-After': '5' } : {},
		);
	}
});

// Tempos do servidor acima do pior caso do render (120 s) para não cortar um PDF grande no meio.
server.requestTimeout = 150_000;
server.headersTimeout = 10_000;

server.listen(PORT, '0.0.0.0', () => {
	console.log(`pdf ouvindo na porta ${PORT} (versão ${VERSION})`);
});

async function stop() {
	server.close();
	await shutdown(25_000);
	process.exit(0);
}

process.on('SIGTERM', stop);
process.on('SIGINT', stop);
