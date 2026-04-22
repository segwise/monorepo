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
	async rewrites() {
		return [
			{
				source: '/referral/:code*',
				destination: `${process.env.NEXT_PUBLIC_API_URL}/referral/:code*`,
			},
			{
				source: '/application',
				destination: `${process.env.NEXT_PUBLIC_API_URL}/download-application`,
			},
		];
	},
};

export default nextConfig;
