import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	output: 'standalone',
	outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
	reactCompiler: true,
	cacheComponents: true,
	images: {
		qualities: [100],
		dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
		remotePatterns: [
			{
				hostname: '**',
			},
		],
	},
	devIndicators: false,
	// SHA do commit da imagem (build-arg GIT_SHA → APP_VERSION no Dockerfile). O CD confere este
	// header depois do deploy para saber que é a versão nova que está respondendo.
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'X-App-Version', value: process.env.APP_VERSION ?? 'unknown' },
				],
			},
		];
	},
};

export default nextConfig;
