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
	findMatch,
} from '@/functions/fingerprint/generate';

function registerRoutersServicesUtilsReferral(server: Server) {
	const base = server.basePath('/referral');

	base.get(
		'/:code',
		zValidator(
			'param',
			z.object({
				code: SchemaReferral,
			}),
		),
		async (ctx) => {
			const { code } = ctx.req.valid('param');

			const partner = await ctx.database.member.findUnique({
				where: { referral: code },
			});

			if (!partner) {
				return ctx.redirect(FALLBACK_URL, 302);
			}

			const remoteIp =
				ctx.req.header('cf-connecting-ip') ??
				ctx.req.header('x-forwarded-for')?.split(',')[0] ??
				'unknown';

			const fp = buildFingerprint(ctx.req.raw.headers, remoteIp);

			await cacheClick({
				referralCode: code,
				partnerId: partner.id,
				ip: fp.ip,
				uaHash: fp.uaHash,
				language: fp.language,
				os: fp.os,
			});

			console.log('referral:', fp);

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
		'/',
		zValidator(
			'json',
			z.object({
				language: z.string().optional(),
				os: z.string().optional(),
			}),
		),
		async (ctx) => {
			const requestIp =
				ctx.req.header('cf-connecting-ip') ??
				ctx.req.header('x-forwarded-for')?.split(',')[0] ??
				'unknown';

			const userAgent = ctx.req.raw.headers.get('user-agent') ?? 'unknown';

			const data = ctx.req.valid('json');

			console.log({
				ip: requestIp,
				userAgent,
				language: data.language ?? null,
				os: ('android' || data.os) ?? null,
			});

			const match = await findMatch({
				ip: requestIp,
				userAgent,
				language: data.language ?? null,
				os: ('android' || data.os) ?? null,
			});

			const referral = {
				matched: match.matched,
				referralCode: match.referralCode,
				partnerId: match.partnerId,
				score: match.score,
				cached: false,
			};

			console.log('referral:', referral);

			return ctx.json(referral, 200);
		},
	);
}

export { registerRoutersServicesUtilsReferral };
