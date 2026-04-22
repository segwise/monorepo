import type { Server } from '@/@types/server';
import {
	APP_STORE_URL,
	FALLBACK_URL,
	PLAY_STORE_URL,
} from '@/const/url-application';

function registerRoutersServicesUtilsDownloadApplication(server: Server) {
	const base = server.basePath('/download-application');

	base.get('/', async (ctx) => {
		const userAgent = ctx.req.raw.headers.get('user-agent') ?? 'unknown';

		const ua = userAgent.toLowerCase();

		const isIos = /iphone|ipad|ipod/.test(ua);
		const isAndroid = /android/.test(ua);

		if (isIos) {
			return ctx.redirect(APP_STORE_URL, 302);
		}

		if (isAndroid) {
			return ctx.redirect(PLAY_STORE_URL, 302);
		}

		return ctx.redirect(FALLBACK_URL, 302);
	});
}

export { registerRoutersServicesUtilsDownloadApplication };
