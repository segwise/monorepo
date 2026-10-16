import { environment } from '@/environment';

// Cliente do serviço de PDF (apps/pdf): recebe HTML autossuficiente (CSS embutido e imagens `data:`,
// ver styles.generated.ts e inline-image.ts) e devolve os bytes do PDF. O Chromium roda lá, numa rede
// interna sem acesso à internet.
type PdfOptions = {
	format?: 'A4' | 'Letter';
	printBackground?: boolean;
	margin?: { top?: string; right?: string; bottom?: string; left?: string };
	pageRanges?: string;
	// Teto de renderização no serviço (padrão dele: 30 s; máximo 120 s).
	timeoutMs?: number;
};

class PdfServiceError extends Error {
	status: number | undefined;

	constructor(message: string, status?: number) {
		super(message);
		this.name = 'PdfServiceError';
		this.status = status;
	}
}

const DEFAULT_RENDER_TIMEOUT_MS = 30_000;
// Folga sobre o teto do serviço para o tempo de fila e de rede.
const NETWORK_MARGIN_MS = 35_000;
const RETRY_DELAY_MS = 500;

async function request(html: string, options: PdfOptions) {
	return await fetch(`${environment.PDF_SERVICE_URL}/render`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${environment.PDF_SERVICE_TOKEN}`,
		},
		body: JSON.stringify({ html, options }),
		signal: AbortSignal.timeout(
			(options.timeoutMs ?? DEFAULT_RENDER_TIMEOUT_MS) + NETWORK_MARGIN_MS,
		),
	});
}

// Gerar PDF é idempotente: uma falha de conexão ou um 503 (serviço reiniciando ou fila cheia) merece
// uma segunda tentativa. Qualquer outro erro (400, 401, 504, 500) volta direto.
async function renderPdf(
	html: string,
	options: PdfOptions = {},
): Promise<Uint8Array> {
	let response: Response | undefined;

	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			response = await request(html, options);
		} catch (error) {
			if (attempt === 1) {
				throw new PdfServiceError(
					`Serviço de PDF indisponível: ${error instanceof Error ? error.message : error}`,
				);
			}

			await Bun.sleep(RETRY_DELAY_MS);

			continue;
		}

		if (response.status !== 503 || attempt === 1) break;

		await response.body?.cancel();
		await Bun.sleep(RETRY_DELAY_MS);
	}

	if (!response?.ok) {
		throw new PdfServiceError(
			`Serviço de PDF respondeu ${response?.status}`,
			response?.status,
		);
	}

	return new Uint8Array(await response.arrayBuffer());
}

export { type PdfOptions, PdfServiceError, renderPdf };
