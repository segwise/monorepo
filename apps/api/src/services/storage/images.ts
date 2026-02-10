const storage = new Bun.S3Client({
	endpoint: Bun.env.MINIO_ENDPOINT,
	accessKeyId: Bun.env.MINIO_ACCESS_KEY,
	secretAccessKey: Bun.env.MINIO_SECRET_KEY,
	bucket: 'images',
});

export { storage };
