import path from 'node:path';
import type { NextConfig } from 'next';

// Destino de `/api/*` no próprio domínio do site (o navegador fala com a api pela origem do site: sem CORS
// e sem a requisição OPTIONS antes das chamadas). O Next repassa pela rede interna `api-web` em produção
// (API_INTERNAL_URL, argumento de build do Dockerfile) e para a api local em desenvolvimento. Os rewrites
// são fixados no build: por isso o destino vem de um valor de build, não do ambiente em tempo de execução.
const apiProxyTarget =
	process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

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
	async rewrites() {
		if (!apiProxyTarget) return [];

		return {
			beforeFiles: [
				{ source: '/api/:path*', destination: `${apiProxyTarget}/:path*` },
			],
			afterFiles: [],
			fallback: [],
		};
	},
	experimental: {
		// O repasse do rewrite corta em 30 s por padrão; impressão de relatórios grandes e extração de PDF
		// por IA passam disso (a impressão pode levar até 120 s).
		proxyTimeout: 180_000,
		// O Next guarda o corpo da requisição para o proxy (src/proxy.ts) e, acima deste limite, repassa à api
		// só o começo (o upload trava). O padrão é 10 MB; PDFs de apólice escaneados passam disso. A api
		// aceita até 128 MB (padrão do Bun.serve).
		proxyClientMaxBodySize: '64mb',
	},
};

export default nextConfig;
