import { timingSafeEqual } from 'node:crypto';
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

function isAuthorized(request: Request) {
	if (!TOKEN) return true; // só em desenvolvimento (em produção o boot exige o token)

	const received = Buffer.from(request.headers.get('authorization') ?? '');
	const expected = Buffer.from(`Bearer ${TOKEN}`);

	return (
		received.length === expected.length && timingSafeEqual(received, expected)
	);
}

function json(
	status: number,
	body: object,
	headers: Record<string, string> = {},
) {
	return Response.json(body, {
		status,
		headers: { 'X-App-Version': VERSION, ...headers },
	});
}

function log(entry: Record<string, unknown>) {
	console.log(JSON.stringify(entry));
}

async function handleRender(request: Request) {
	const started = performance.now();

	if (!isAuthorized(request)) {
		return json(401, { message: 'Não autorizado' });
	}

	try {
		const parsed = requestSchema.safeParse(await request.json());

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

		log({
			route: 'render',
			status: 200,
			bytes: pdf.length,
			ms: Math.round(performance.now() - started),
		});

		return new Response(pdf, {
			headers: { 'Content-Type': 'application/pdf', 'X-App-Version': VERSION },
		});
	} catch (error) {
		const status =
			error instanceof SyntaxError
				? 400
				: error instanceof BusyError
					? 503
					: error instanceof RenderTimeoutError
						? 504
						: 500;

		log({
			route: 'render',
			status,
			ms: Math.round(performance.now() - started),
			error: error instanceof Error ? error.message.split('\n')[0] : 'erro',
		});

		return json(
			status,
			{
				message:
					status === 500 ? 'Erro ao gerar PDF' : (error as Error).message,
			},
			status === 503 ? { 'Retry-After': '5' } : {},
		);
	}
}

// Servidor HTTP nativo do Bun: o limite do corpo (413) e as rotas são do próprio Bun.serve.
const server = Bun.serve({
	port: PORT,
	hostname: '0.0.0.0',
	maxRequestBodySize: MAX_BODY_BYTES,
	// Acima do pior caso de render (120 s) para não cortar um PDF grande no meio (máximo do Bun: 255 s).
	idleTimeout: 150,
	routes: {
		'/health': {
			GET: async () =>
				(await isBrowserReady())
					? json(200, { status: 'ok' })
					: json(503, { status: 'browser indisponível' }),
		},
		'/render': {
			POST: handleRender,
		},
	},
	fetch: () => json(404, { message: 'Não encontrado' }),
	error: (error) => {
		log({ route: 'error', status: 500, error: error.message.split('\n')[0] });

		return json(500, { message: 'Erro ao gerar PDF' });
	},
});

console.log(`pdf ouvindo na porta ${server.port} (versão ${VERSION})`);

async function stop() {
	// Para de aceitar e espera os pedidos em andamento; depois fecha o Chromium.
	await server.stop();
	await shutdown(25_000);
	process.exit(0);
}

process.on('SIGTERM', stop);
process.on('SIGINT', stop);
