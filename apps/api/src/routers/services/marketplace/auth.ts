import { zValidator } from '@hono/zod-validator';
import { SchemaMarketplaceSignIn } from '@segwise/core';
import type { Server } from '@/@types/server';
import { StatusSafe } from '@/generated/prisma/enums';

function registerRoutersServicesMarketplaceAuth(server: Server) {
	server.get(
		'/auth',
		zValidator('query', SchemaMarketplaceSignIn),
		async (ctx) => {
			const { cpf, birth, company } = ctx.req.valid('query');

			const isInsured = await ctx.database.safe.findFirst({
				where: {
					insured: {
						cpf,
						birth,
					},
					...(company && {
						brokerId: company,
					}),
					status: StatusSafe.active,
				},
				select: {
					insuredId: true,
				},
			});

			if (!isInsured?.insuredId) {
				return ctx.json(
					{
						message: 'Dados inválidos',
					},
					401,
				);
			}

			return ctx.json(
				{
					id: isInsured.insuredId,
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesMarketplaceAuth };
