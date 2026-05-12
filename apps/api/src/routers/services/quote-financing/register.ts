import { zValidator } from '@hono/zod-validator';
import { SchemaQuoteFinancingRegister } from '@segwise/core';
import type { Server } from '@/@types/server';

function registerRoutersServicesQuoteFinancingRegister(server: Server) {
	server.post(
		'/',
		zValidator('json', SchemaQuoteFinancingRegister),
		async (ctx) => {
			const { vehicle, financed, referral } = ctx.req.valid('json');

			await ctx.database.quoteFinancingAVehicle.create({
				data: {
					referral,
					model: vehicle.model,
					year: vehicle.year,
					amount: vehicle.amount,
					downPayment: vehicle.downPayment,
					name: financed.name,
					phone: financed.phone,
				},
			});

			return ctx.json(
				{
					ok: true,
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesQuoteFinancingRegister };
