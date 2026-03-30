import { type Browser, type BrowserContext, chromium } from 'playwright';
import { environment } from '../environment';

let browserInstance: Browser | null = null;
const contextPool: BrowserContext[] = [];
const MAX_CONTEXTS = 6;

let isShuttingDown = false;

async function getBrowser(): Promise<Browser> {
	if (isShuttingDown) {
		throw new Error('Servidor está desligando');
	}

	if (!browserInstance || !browserInstance.isConnected()) {
		console.log('Não existe browser');

		browserInstance = await chromium.launch({
			headless: true,
			...(environment.NODE_ENV !== 'development' && {
				executablePath: '/usr/bin/chromium-browser',
			}),
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
	} else {
		console.log('Existe browser');
	}

	return browserInstance;
}

async function acquirePage() {
	const browser = await getBrowser();

	if (contextPool.length > 0) {
		const context = contextPool.pop();

		if (context?.browser()) {
			const page = await context.newPage();

			return { page, context, release };
		}
	}

	if (contextPool.length + 1 > MAX_CONTEXTS) {
		await new Promise((resolve) => setTimeout(resolve, 50));
	}

	const context = await browser.newContext({
		viewport: { width: 1200, height: 1700 },
		deviceScaleFactor: 1,
	});

	const page = await context.newPage();

	return { page, context, release };

	async function release() {
		if (isShuttingDown || !context.browser()) {
			return;
		}

		await page.close().catch(() => {});

		if (contextPool.length < MAX_CONTEXTS) {
			contextPool.push(context);
		} else {
			await context.close().catch(() => {});
		}
	}
}

async function shutdownBrowser() {
	isShuttingDown = true;

	for (const ctx of contextPool) {
		await ctx.close().catch(() => {});
	}

	contextPool.length = 0;

	if (browserInstance) {
		await browserInstance.close().catch(() => {});
		browserInstance = null;
	}
}

export { acquirePage, shutdownBrowser };
