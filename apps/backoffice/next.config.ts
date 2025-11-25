import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactCompiler: true,
	redirects() {
		return [
			{
				source: '/',
				destination: '/sign-in',
				permanent: true,
			},
		];
	},
};

export default nextConfig;
