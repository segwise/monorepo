import { zValidator } from '@hono/zod-validator';
import { SchemaReferral } from '@segwise/core';
import z from 'zod';
import type { Server } from '@/@types/server';
import {
	APP_STORE_URL,
	APP_STORE_XCAR_URL,
	FALLBACK_URL,
	PLAY_STORE_URL,
	PLAY_STORE_XCAR_URL,
} from '@/const/url-application';
import {
	buildFingerprint,
	cacheClick,
	deleteMatch,
	extractIp,
	findMatch,
} from '@/functions/fingerprint/generate';
import { resolveProducerByReferral } from '@/functions/producers/resolve-producer-by-referral';

function registerRoutersServicesUtilsApplicationReferral(server: Server) {
	const base = server.basePath('/application');

	base.get(
		'/',
		zValidator(
			'query',
			z
				.object({
					referral: SchemaReferral.nullish(),
					package: z.literal(['br.com.segwise.xcarcorretora']).nullish(),
				})
				.partial()
				.strict(),
		),
		async (ctx) => {
			const { referral, package: url } = ctx.req.valid('query');

			if (!referral) {
				const userAgent = ctx.req.raw.headers.get('user-agent') ?? 'unknown';

				const ua = userAgent.toLowerCase();

				const isIos = /iphone|ipad|ipod/.test(ua);
				const isAndroid = /android/.test(ua);

				if (isIos) {
					return ctx.redirect(url ? APP_STORE_XCAR_URL : APP_STORE_URL, 302);
				}

				if (isAndroid) {
					return ctx.redirect(url ? PLAY_STORE_XCAR_URL : PLAY_STORE_URL, 302);
				}

				return ctx.redirect(FALLBACK_URL, 302);
			}

			const resolved = await resolveProducerByReferral(ctx, referral);
			const partner = resolved
				? { id: resolved.memberId ?? resolved.userId }
				: null;

			if (!partner) {
				return ctx.redirect(FALLBACK_URL, 302);
			}

			const requestIp = extractIp(ctx.req.raw.headers, 'unknown');

			const fp = buildFingerprint(ctx.req.raw.headers, requestIp);

			await cacheClick({
				referralCode: referral,
				partnerId: partner.id,
				ip: fp.ip,
				uaHash: fp.uaHash,
				language: fp.language,
				os: fp.os,
			});

			const ua = fp.userAgent.toLowerCase();

			const isIos = /iphone|ipad|ipod/.test(ua);
			const isAndroid = /android/.test(ua);

			if (isIos) {
				return ctx.redirect(APP_STORE_URL, 302);
			}

			if (isAndroid) {
				return ctx.redirect(PLAY_STORE_URL, 302);
			}

			return ctx.redirect(FALLBACK_URL, 302);
		},
	);

	base.post(
		'/referral',
		zValidator(
			'json',
			z
				.object({
					language: z.string(),
					os: z.string(),
				})
				.strict(),
		),
		async (ctx) => {
			try {
				const requestIp = extractIp(ctx.req.raw.headers, 'unknown');

				const userAgent = ctx.req.raw.headers.get('user-agent') ?? 'unknown';

				const data = ctx.req.valid('json');

				const match = await findMatch({
					ip: requestIp,
					userAgent,
					language: data.language ?? null,
					os: data.os ?? null,
				});

				const referral = {
					matched: match.matched,
					referralCode: match.referralCode,
					partnerId: match.partnerId,
					score: match.score,
					cached: false,
				};

				if (referral.referralCode) {
					await deleteMatch(requestIp, match.hash);
				}

				if (!referral.referralCode) {
					return ctx.json({}, 200);
				}

				return ctx.json(referral, 200);
			} catch {
				return ctx.json({}, 200);
			}
		},
	);
}

export { registerRoutersServicesUtilsApplicationReferral };
