import { zValidator } from '@hono/zod-validator';
import { SchemaMarketplaceSignIn } from '@segwise/core';
import type { Server } from '@/@types/server';

function registerRoutersServicesMarketplaceAuth(server: Server) {
	server.get(
		'/auth',
		zValidator('query', SchemaMarketplaceSignIn),
		async (ctx) => {
			const { cpf, birth } = ctx.req.valid('query');

			const isInsured = await ctx.database.safe.findFirst({
				where: {
					insured: {
						cpf,
						birth,
					},
				},
			});

			if (!isInsured) {
				return ctx.json(
					{
						message: 'Dados inválidos',
					},
					401,
				);
			}

			return ctx.json(
				{
					message: 'Logado com sucesso',
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesMarketplaceAuth };
