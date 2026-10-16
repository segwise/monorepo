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
};

export default nextConfig;
