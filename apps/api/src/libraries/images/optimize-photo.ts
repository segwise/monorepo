// Fotos enviadas pelo celular chegam com vários MB e com metadados EXIF (que podem trazer a localização
// GPS de quem fotografou). Antes de ir para o S3 (público), a foto é girada conforme o EXIF, reduzida para
// caber em MAX_SIDE e reconvertida para WebP: o re-encode não leva o EXIF junto. Bun.Image (Bun 1.4) roda
// fora da thread principal e recusa imagens com resolução absurda (maxPixels) antes de alocar memória.
const MAX_SIDE = 1600;
const QUALITY = 80;
// 60 MP cobre as câmeras de celular atuais (48 MP); acima disso nem tenta decodificar.
const MAX_PIXELS = 60_000_000;

type Photo = { bytes: ArrayBuffer | Uint8Array; type: string; ext: string };

async function optimizePhoto(
	input: ArrayBuffer,
	originalType: string,
): Promise<Photo> {
	try {
		const bytes = await new Bun.Image(input, { maxPixels: MAX_PIXELS })
			.resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
			.webp({ quality: QUALITY })
			.bytes();

		return { bytes, type: 'image/webp', ext: 'webp' };
	} catch (error) {
		// Formato que o Bun não decodifica no Linux (ex.: HEIC), arquivo corrompido ou resolução acima do
		// limite: segue com a original, como era antes, em vez de recusar o anúncio.
		console.warn(
			'[images] foto enviada sem otimizar:',
			(error as { code?: string }).code ?? (error as Error).message,
		);

		const ext = originalType.split('/')[1] ?? 'jpeg';

		return {
			bytes: input,
			type: originalType.startsWith('image/') ? originalType : `image/${ext}`,
			ext,
		};
	}
}

export { optimizePhoto };
