import { zValidator } from '@hono/zod-validator';
import { SchemaReferral } from '@segwise/core';
import z from 'zod';
import type { Server } from '@/@types/server';
import {
	APP_STORE_URL,
	FALLBACK_URL,
	PLAY_STORE_URL,
} from '@/const/url-application';
import {
	buildFingerprint,
	cacheClick,
	extractIp,
	findMatch,
} from '@/functions/fingerprint/generate';

function registerRoutersServicesUtilsApplicationReferral(server: Server) {
	const base = server.basePath('/application');

	base.get(
		'/',
		zValidator(
			'param',
			z
				.object({
					referral: SchemaReferral.nullish(),
				})
				.partial()
				.strict(),
		),
		async (ctx) => {
			const { referral } = ctx.req.valid('param');

			if (!referral) {
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
			}

			const partner = await ctx.database.member.findUnique({
				where: { referral },
			});

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

			return ctx.json(referral, 200);
		},
	);
}

export { registerRoutersServicesUtilsApplicationReferral };
