import { type Browser, chromium } from 'playwright-core';

type PdfOptions = {
	format: 'A4' | 'Letter';
	printBackground: boolean;
	margin?: { top?: string; right?: string; bottom?: string; left?: string };
	pageRanges?: string;
	timeoutMs: number;
};

class BusyError extends Error {}
class RenderTimeoutError extends Error {}

const MAX_CONCURRENCY = Number(process.env.MAX_CONCURRENCY ?? 4);
// Quanto um pedido espera por uma vaga antes de desistir (a API tenta de novo ou devolve 503).
const QUEUE_TIMEOUT_MS = 30_000;

let browserPromise: Promise<Browser> | null = null;
let shuttingDown = false;
let running = 0;
const waiting: Array<() => void> = [];

function launch(): Promise<Browser> {
	const promise = chromium
		.launch({
			headless: true,
			executablePath: process.env.CHROMIUM_PATH || undefined,
			// Sem sandbox do Chromium: sob `cap_drop: ALL` e o seccomp padrão ele nem inicia. A contenção
			// está no resto: sem rede, sem JavaScript, HTML só da API, container sem root e raiz só leitura.
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
		})
		.then((browser) => {
			browser.on('disconnected', () => {
				if (browserPromise === promise) browserPromise = null;
			});

			return browser;
		});

	// Falha de launch não pode ficar em cache: o próximo pedido tenta de novo.
	promise.catch(() => {
		if (browserPromise === promise) browserPromise = null;
	});

	return promise;
}

function getBrowser(): Promise<Browser> {
	if (shuttingDown) throw new Error('Servidor está desligando');

	browserPromise ??= launch();

	return browserPromise;
}

async function acquireSlot() {
	if (running < MAX_CONCURRENCY) {
		running++;

		return;
	}

	await new Promise<void>((resolve, reject) => {
		const timer = setTimeout(() => {
			waiting.splice(waiting.indexOf(grant), 1);
			reject(new BusyError('Fila cheia'));
		}, QUEUE_TIMEOUT_MS);

		function grant() {
			clearTimeout(timer);
			resolve();
		}

		waiting.push(grant);
	});
}

function releaseSlot() {
	const next = waiting.shift();

	// A vaga passa direto para o próximo da fila (running não muda).
	if (next) next();
	else running--;
}

// Um contexto novo por pedido: nada (cookies, cache, estado) vaza de um PDF para o outro.
// Sem JavaScript e sem rede (offline): o HTML recebido é só HTML + CSS + imagens `data:`.
async function renderPdf(
	html: string,
	options: PdfOptions,
): Promise<Uint8Array> {
	await acquireSlot();

	try {
		const browser = await getBrowser();
		const context = await browser.newContext({
			javaScriptEnabled: false,
			offline: true,
			serviceWorkers: 'block',
			acceptDownloads: false,
			viewport: { width: 1200, height: 1700 },
			deviceScaleFactor: 1,
		});

		let timedOut = false;
		const timer = setTimeout(() => {
			timedOut = true;
			void context.close().catch(() => {});
		}, options.timeoutMs);

		try {
			const page = await context.newPage();

			await page.setContent(html, {
				waitUntil: 'load',
				timeout: options.timeoutMs,
			});

			return await page.pdf({
				format: options.format,
				printBackground: options.printBackground,
				margin: options.margin,
				pageRanges: options.pageRanges,
			});
		} catch (error) {
			if (timedOut) throw new RenderTimeoutError('Tempo esgotado');

			throw error;
		} finally {
			clearTimeout(timer);
			await context.close().catch(() => {});
		}
	} finally {
		releaseSlot();
	}
}

async function isBrowserReady() {
	try {
		return (await getBrowser()).isConnected();
	} catch {
		return false;
	}
}

// Para de aceitar trabalho, espera os PDFs em andamento e fecha o Chromium.
async function shutdown(graceMs: number) {
	shuttingDown = true;

	const deadline = Date.now() + graceMs;

	while (running > 0 && Date.now() < deadline) {
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	const browser = await browserPromise?.catch(() => null);

	await browser?.close().catch(() => {});
}

export {
	BusyError,
	isBrowserReady,
	type PdfOptions,
	RenderTimeoutError,
	renderPdf,
	shutdown,
};
