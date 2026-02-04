import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	output: 'standalone',
	reactCompiler: true,
	cacheComponents: true,
	images: {
		qualities: [100],
		remotePatterns: [
			{
				hostname: '**',
			},
		],
	},
	devIndicators: false,
};

export default nextConfig;
