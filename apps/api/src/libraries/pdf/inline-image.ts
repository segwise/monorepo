import QuickLRU from 'quick-lru';

// O HTML dos PDFs tem que ser autossuficiente: quem o renderiza não deve precisar de rede. Imagens
// (ex.: o ícone da seguradora, que vem de uma URL pré-assinada do S3) são baixadas aqui e viram
// `data:` URI dentro do HTML.
const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 5000;
const ALLOWED_TYPES = new Set([
	'image/png',
	'image/jpeg',
	'image/webp',
	'image/gif',
	'image/svg+xml',
]);

// As URLs pré-assinadas mudam a cada hora, então a chave é o caminho sem a query string.
const cache = new QuickLRU<string, string>({
	maxSize: 500,
	maxAge: 60 * 60 * 1000,
});

async function toDataUri(url: string): Promise<string | undefined> {
	const key = url.split('?')[0] ?? url;
	const cached = cache.get(key);

	if (cached) return cached;

	try {
		const response = await fetch(url, {
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});

		if (!response.ok) return undefined;

		const type = response.headers.get('content-type')?.split(';')[0]?.trim();

		if (!type || !ALLOWED_TYPES.has(type)) return undefined;

		const bytes = await response.arrayBuffer();

		if (bytes.byteLength > MAX_BYTES) return undefined;

		const dataUri = `data:${type};base64,${Buffer.from(bytes).toString('base64')}`;

		cache.set(key, dataUri);

		return dataUri;
	} catch {
		// Sem imagem o PDF sai igual, só sem o ícone.
		return undefined;
	}
}

export { toDataUri };
