import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	output: 'standalone',
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
