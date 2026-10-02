import { PDFParse } from 'pdf-parse';

type RenderPagesOptions = {
	maxPages?: number;
	width?: number;
};

async function renderPdfPages(
	buffer: ArrayBuffer,
	{ maxPages = 6, width = 1000 }: RenderPagesOptions = {},
): Promise<string[]> {
	const parser = new PDFParse({ data: Buffer.from(buffer) });

	try {
		const result = await parser.getScreenshot({
			first: maxPages,
			desiredWidth: width,
			imageDataUrl: true,
			imageBuffer: false,
		});

		return result.pages.map((page) => page.dataUrl);
	} catch (error) {
		console.warn(
			'[pdf] não foi possível renderizar as páginas como imagem:',
			error instanceof Error ? error.message : error,
		);

		return [];
	} finally {
		await parser.destroy().catch(() => {});
	}
}

export { renderPdfPages };
