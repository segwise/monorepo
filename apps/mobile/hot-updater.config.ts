import { s3Storage } from '@hot-updater/aws';
import { expo } from '@hot-updater/expo';
import { standaloneRepository } from '@hot-updater/standalone';
import { defineConfig } from 'hot-updater';

import 'dotenv/config';

const config = defineConfig({
	build: expo(),
	updateStrategy: 'appVersion',
	storage: s3Storage({
		region: 'sa-east-1',
		endpoint: process.env.HOT_UPDATER_S3_ENDPOINT,
		credentials: {
			accessKeyId: process.env.HOT_UPDATER_S3_ACCESS_KEY_ID as string,
			secretAccessKey: process.env.HOT_UPDATER_S3_SECRET_ACCESS_KEY as string,
		},
		bucketName: process.env.HOT_UPDATER_S3_BUCKET_NAME as string,
		forcePathStyle: true,
	}),
	database: standaloneRepository({
		baseUrl: process.env.HOT_UPDATER_URL as string,
		commonHeaders: {
			Authorization: `Bearer ${process.env.HOT_UPDATER_AUTH_TOKEN}`,
		},
	}),
	patch: {
		enabled: true,
		maxBaseBundles: 3,
	},
});

export default config;
