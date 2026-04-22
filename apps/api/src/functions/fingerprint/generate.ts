import { createHash } from 'node:crypto';
import { UAParser } from 'ua-parser-js';
import { cache } from '@/services/cache';

interface FingerprintData {
	ip: string;
	userAgent: string;
	uaHash: string;
	language: string | null;
	platform: string | null;
	os: string | null;
	osVersion: string | null;
	deviceType: string | null;
	browser: string | null;
	referer: string | null;
}

interface ClickCacheEntry {
	referralCode: string;
	partnerId: string;
	ip: string;
	uaHash: string;
	language: string | null;
	os: string | null;
}

interface MatchResult {
	matched: boolean;
	score: number;
	referralCode: string | null;
	partnerId: string | null;
	hash: string | null;
}

const FINGERPRINT_TTL_SECONDS = 72 * 60 * 60;

const MIN_MATCH_SCORE = 70;

function normalizeIp(raw: string): string {
	const ipv4Mapped = raw.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);

	if (ipv4Mapped) {
		return ipv4Mapped[1] as string;
	}

	if (raw === '::1') return '127.0.0.1';

	return raw;
}

function extractIp(headers: Headers, fallback: string): string {
	const cfIp = headers.get('cf-connecting-ip');

	if (cfIp) {
		return normalizeIp(cfIp.trim());
	}

	const realIp = headers.get('x-real-ip');

	if (realIp) {
		return normalizeIp(realIp.trim());
	}

	const forwardedFor = headers.get('x-forwarded-for');

	if (forwardedFor) {
		return normalizeIp(forwardedFor.split(',')[0]?.trim() as string);
	}

	return normalizeIp(fallback);
}

function hashUa(userAgent: string): string {
	return createHash('md5').update(userAgent.toLowerCase().trim()).digest('hex');
}

function buildFingerprint(headers: Headers, remoteIp: string): FingerprintData {
	const userAgent = headers.get('user-agent') ?? 'unknown';
	const parser = new UAParser(userAgent);
	const ua = parser.getResult();

	const deviceType = ua.device.type ?? 'desktop';

	return {
		ip: extractIp(headers, remoteIp),
		userAgent,
		uaHash: hashUa(userAgent),
		language: headers.get('accept-language')?.split(',')[0] ?? null,
		platform: ua.os.name ?? null,
		os: ua.os.name ?? null,
		osVersion: ua.os.version ?? null,
		deviceType,
		browser: ua.browser.name ?? null,
		referer: headers.get('referer') ?? null,
	};
}

function buildRedisKey(ip: string, uaHash: string): string {
	return `fp:${ip}:${uaHash}`;
}

function buildRedisIpKey(ip: string): string {
	return `fp:ip:${ip}`;
}

async function cacheClick(entry: ClickCacheEntry): Promise<void> {
	const value = JSON.stringify(entry);

	const exactKey = buildRedisKey(entry.ip, entry.uaHash);
	await cache.setex(exactKey, FINGERPRINT_TTL_SECONDS, value);

	const ipKey = buildRedisIpKey(entry.ip);

	await cache.setex(ipKey, FINGERPRINT_TTL_SECONDS, value);
}

async function findMatch(params: {
	ip: string;
	userAgent: string;
	language: string | null;
	os: string | null;
}): Promise<MatchResult> {
	const uaHash = hashUa(params.userAgent);

	const exactKey = buildRedisKey(params.ip, uaHash);

	const exactRaw = await cache.get(exactKey);

	if (exactRaw) {
		const entry: ClickCacheEntry = JSON.parse(exactRaw);

		let score = 80;

		if (params.language && entry.language) {
			const langMatch = params.language
				.toLowerCase()
				.startsWith(entry.language.toLowerCase().split('-')[0] as string);

			if (langMatch) {
				score += 10;
			}
		}

		if (params.os && entry.os) {
			if (params.os.toLowerCase() === entry.os.toLowerCase()) {
				score += 10;
			}
		}

		return {
			matched: score >= MIN_MATCH_SCORE,
			score,
			referralCode: entry.referralCode,
			partnerId: entry.partnerId,
			hash: entry.uaHash,
		};
	}

	const ipKey = buildRedisIpKey(params.ip);

	const ipRaw = await cache.get(ipKey);

	if (ipRaw) {
		const entry: ClickCacheEntry = JSON.parse(ipRaw);

		let score = 50;

		if (uaHash === entry.uaHash) {
			score += 30;
		}

		if (params.language && entry.language) {
			const langMatch = params.language
				.toLowerCase()
				.startsWith(entry.language.toLowerCase().split('-')[0] as string);

			if (langMatch) {
				score += 10;
			}
		}

		if (params.os && entry.os) {
			if (params.os.toLowerCase() === entry.os.toLowerCase()) {
				score += 10;
			}
		}

		return {
			matched: score >= MIN_MATCH_SCORE,
			score,
			referralCode: entry.referralCode,
			partnerId: entry.partnerId,
			hash: entry.uaHash,
		};
	}

	return {
		matched: false,
		score: 0,
		referralCode: null,
		partnerId: null,
		hash: null,
	};
}

async function deleteMatch(ip: string, hash?: string | null) {
	if (hash) {
		const keyIpHash = buildRedisKey(ip, hash);

		const exists = await cache.exists(keyIpHash);

		if (exists) {
			await cache.del(keyIpHash);
		}
	}

	if (ip) {
		const keyIp = buildRedisIpKey(ip);

		const exists = await cache.exists(keyIp);

		if (exists) {
			await cache.del(keyIp);
		}
	}
}

export {
	buildFingerprint,
	buildRedisKey,
	buildRedisIpKey,
	cacheClick,
	extractIp,
	findMatch,
	deleteMatch,
};
