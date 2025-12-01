import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	output: 'standalone',
	reactCompiler: true,
	cacheComponents: true,
	images: {
		qualities: [100],
	},
};

export default nextConfig;
