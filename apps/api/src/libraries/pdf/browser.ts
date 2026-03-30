import {
	type Browser,
	type BrowserContext,
	chromium,
	type Page,
} from 'playwright';

let browserInstance: Browser | null = null;
const contextPool: BrowserContext[] = [];
const MAX_CONTEXTS = 6;

let isShuttingDown = false;

async function getBrowser(): Promise<Browser> {
	if (isShuttingDown) {
		throw new Error('Servidor está desligando');
	}

	if (!browserInstance || !browserInstance.isConnected()) {
		browserInstance = await chromium.launch({
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-gpu',
				'--disable-extensions',
				'--disable-background-networking',
				'--disable-features=IsolateOrigins,site-per-process',
				'--single-process',
			],
		});
	}

	return browserInstance;
}

async function acquirePage() {
	const browser = await getBrowser();

	let context: BrowserContext;
	let page: Page;

	if (contextPool.length > 0) {
		const reused = contextPool.pop();

		if (reused?.browser()) {
			context = reused;

			page = await context.newPage();

			return { page, context, release };
		}
	}

	if (contextPool.length + 1 > MAX_CONTEXTS) {
		await new Promise((r) => setTimeout(r, 40));
	}

	context = await browser.newContext({
		viewport: { width: 1200, height: 1700 },
		deviceScaleFactor: 1,
	});

	page = await context.newPage();

	return { page, context, release };

	async function release() {
		if (isShuttingDown) return;

		await page?.close().catch(() => {});

		if (contextPool.length < MAX_CONTEXTS && context?.browser()) {
			contextPool.push(context);
		} else {
			await context?.close().catch(() => {});
		}
	}
}

async function shutdownBrowser() {
	isShuttingDown = true;

	for (const ctx of [...contextPool]) {
		await ctx.close().catch(() => {});
	}

	contextPool.length = 0;

	if (browserInstance) {
		await browserInstance.close().catch(() => {});

		browserInstance = null;
	}
}

export { acquirePage, shutdownBrowser };
