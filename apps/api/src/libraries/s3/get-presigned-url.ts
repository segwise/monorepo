import QuickLRU from 'quick-lru';

const presignedCache = new QuickLRU<string, { url: string; expiresAt: number }>(
	{
		maxSize: 5000,
		maxAge: 50 * 60 * 1000,
	},
);

const PRESIGNED_TTL = 3600;

function getPresignedUrl(s3: Bun.S3Client, key: string): string {
	const cached = presignedCache.get(key);

	if (cached) {
		return cached.url;
	}

	const url = s3.file(key).presign({
		method: 'GET',
		expiresIn: PRESIGNED_TTL,
	});

	presignedCache.set(key, {
		url,
		expiresAt: Date.now() + (PRESIGNED_TTL - 600) * 1000,
	});

	return url;
}

export { getPresignedUrl };
