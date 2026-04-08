import { zValidator } from '@hono/zod-validator';
import { SchemaProducerRegister } from '@segwise/core';
import type { Server } from '@/@types/server';
import { generateReferral } from '@/functions/generate-referral';
import { Role } from '@/generated/prisma/enums';

function registerRoutersServicesProducersRegister(server: Server) {
	server.post('/', zValidator('json', SchemaProducerRegister), async (ctx) => {
		const brokerId = ctx.session.brokerId;

		const { name, phone, email } = ctx.req.valid('json');

		if (!brokerId) {
			throw new Error('Nenhuma corretora vinculada');
		}

		const { user } = await ctx.auth.api.createUser({
			body: {
				name,
				email,
				password: Bun.randomUUIDv7(),
				// @ts-expect-error
				role: Role.customer,
			},
		});

		await ctx.database.user.update({
			where: {
				id: user.id,
			},
			data: {
				phone,
			},
		});

		await ctx.auth.api.addMember({
			body: {
				userId: user.id,
				// @ts-expect-error
				role: Role.producer,
				organizationId: brokerId,
				referral: generateReferral(),
			},
		});

		return ctx.json(
			{
				message: 'Cadastrado com sucesso!',
			},
			200,
		);
	});
}

export { registerRoutersServicesProducersRegister };
