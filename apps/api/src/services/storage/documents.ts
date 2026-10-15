import { environment } from '@/libraries/environment';

const storage = new Bun.S3Client({
	endpoint: environment.MINIO_ENDPOINT,
	accessKeyId: environment.MINIO_ACCESS_KEY,
	secretAccessKey: environment.MINIO_SECRET_KEY,
	bucket: 'documents',
});

export { storage };
