const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function encodeBase32(value: bigint, size: number) {
	let result = '';

	while (result.length < size && value > 0n) {
		const rest = Number(value % 32n);

		result = chars[rest] + result;

		value /= 32n;
	}

	return result.padStart(size, chars[0]);
}

function randomBigInt(bits: number): bigint {
	let result = 0n;

	let remaining = bits;

	while (remaining > 0) {
		const chunkBits = Math.min(32, remaining);
		const chunkValue = Math.floor(Math.random() * 2 ** chunkBits);

		result = (result << BigInt(chunkBits)) | BigInt(chunkValue);

		remaining -= chunkBits;
	}

	return result;
}

function generateReferral(size: number = 10) {
	const nowMs = BigInt(Date.now());
	const prefixSize = 5;
	const prefix = encodeBase32(nowMs, prefixSize);

	let randomValue = randomBigInt(16);

	if (randomValue === 0n) {
		randomValue = randomBigInt(16);
	}

	const randomParts = encodeBase32(randomValue, size - prefixSize);

	return (prefix + randomParts).toLowerCase();
}

export { generateReferral };
