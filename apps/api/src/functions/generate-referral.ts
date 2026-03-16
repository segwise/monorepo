import { getRandomValues } from 'node:crypto';

const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function encodeBase32(value: bigint, size: number): string {
	let result = '';

	while (result.length < size && value > 0n) {
		const rest = Number(value % 32n);

		result = chars[rest] + result;

		value /= 32n;
	}

	return result.padStart(size, chars[0]);
}

function generateReferral(tamanho: number = 10): string {
	const nowMs = BigInt(Date.now());

	const prefixSize = 5;
	const prefix = encodeBase32(nowMs, prefixSize);

	const randomBytes = new Uint8Array(2);

	getRandomValues(randomBytes);

	if (!randomBytes[0] || !randomBytes[1]) {
		throw new Error('Falha ao gerar código');
	}

	const randomValue = (BigInt(randomBytes[0]) << 10n) | BigInt(randomBytes[1]);
	const randomParts = encodeBase32(randomValue, tamanho - prefixSize);

	return (prefix + randomParts).toLowerCase();
}

export { generateReferral };
