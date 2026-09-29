import { zValidator } from '@hono/zod-validator';
import { SchemaMarketingContact } from '@segwise/core';
import type { MarketingContact } from '@segwise/core/types';
import type { Context } from 'hono';
import type { AppBindings, Server } from '@/@types/server.d';
import {
	countEligibleContacts,
	RESEND_WINDOW_DAYS,
} from '@/libraries/marketing/eligibility';
import { enqueueCampaignNow } from '@/libraries/marketing/queue';

async function findCampaign(ctx: Context<AppBindings>, id: string) {
	const brokerId = ctx.session.brokerId;

	if (!brokerId) {
		return null;
	}

	return await ctx.database.marketingCampaign.findFirst({
		where: { id, brokerId },
		select: { id: true },
	});
}

function registerRoutersServicesMarketingContacts(server: Server) {
	server.post('/campaigns/:id/contacts/:contactId/send', async (ctx) => {
		const id = ctx.req.param('id');
		const contactId = ctx.req.param('contactId');

		if (!(await findCampaign(ctx, id))) {
			return ctx.json({ message: 'Campanha não encontrada' }, 404);
		}

		const contact = await ctx.database.marketingContact.findFirst({
			where: { id: contactId, campaignId: id },
			select: { id: true },
		});

		if (!contact) {
			return ctx.json({ message: 'Contato não encontrado' }, 404);
		}

		if (!(await countEligibleContacts(id, [contactId]))) {
			return ctx.json(
				{
					message: `Esse contato já recebeu o e-mail nos últimos ${RESEND_WINDOW_DAYS} dias`,
				},
				409,
			);
		}

		await enqueueCampaignNow(id, [contactId]);

		return ctx.json({ message: 'Envio adicionado à fila' }, 202);
	});

	server.get('/campaigns/:id/contacts', async (ctx) => {
		const id = ctx.req.param('id');

		if (!(await findCampaign(ctx, id))) {
			return ctx.json({ message: 'Campanha não encontrada' }, 404);
		}

		const contacts = await ctx.database.marketingContact.findMany({
			where: { campaignId: id },
			orderBy: { name: 'asc' },
			include: { deliveries: { orderBy: { sentAt: 'desc' } } },
		});

		const rows: MarketingContact[] = contacts.map((contact) => {
			const latest = contact.deliveries[0];
			const latestOf = (key: 'deliveredAt' | 'openedAt' | 'clickedAt') =>
				contact.deliveries
					.map((delivery) => delivery[key])
					.filter((date): date is Date => !!date)
					.sort((a, b) => b.getTime() - a.getTime())[0];

			return {
				id: contact.id,
				name: contact.name,
				email: contact.email,
				phone: contact.phone,
				sentCount: contact.deliveries.length,
				lastSentAt: latest?.sentAt.toISOString() ?? null,
				deliveredAt: latestOf('deliveredAt')?.toISOString() ?? null,
				openedAt: latestOf('openedAt')?.toISOString() ?? null,
				clickedAt: latestOf('clickedAt')?.toISOString() ?? null,
				openCount: contact.deliveries.reduce((sum, d) => sum + d.openCount, 0),
				clickCount: contact.deliveries.reduce(
					(sum, d) => sum + d.clickCount,
					0,
				),
				status: latest?.status ?? 'never',
			};
		});

		return ctx.json(rows, 200);
	});

	server.post(
		'/campaigns/:id/contacts',
		zValidator('json', SchemaMarketingContact),
		async (ctx) => {
			const id = ctx.req.param('id');

			if (!(await findCampaign(ctx, id))) {
				return ctx.json({ message: 'Campanha não encontrada' }, 404);
			}

			const { name, email, phone } = ctx.req.valid('json');

			const exists = await ctx.database.marketingContact.findUnique({
				where: {
					campaignId_email: { campaignId: id, email: email.toLowerCase() },
				},
				select: { id: true },
			});

			if (exists) {
				return ctx.json({ message: 'Esse e-mail já está na lista' }, 409);
			}

			const contact = await ctx.database.marketingContact.create({
				data: {
					campaignId: id,
					name,
					email: email.toLowerCase(),
					phone: phone || null,
				},
			});

			return ctx.json({ id: contact.id }, 201);
		},
	);

	server.delete('/campaigns/:id/contacts/:contactId', async (ctx) => {
		const id = ctx.req.param('id');

		if (!(await findCampaign(ctx, id))) {
			return ctx.json({ message: 'Campanha não encontrada' }, 404);
		}

		const { count } = await ctx.database.marketingContact.deleteMany({
			where: { id: ctx.req.param('contactId'), campaignId: id },
		});

		if (!count) {
			return ctx.json({ message: 'Contato não encontrado' }, 404);
		}

		return ctx.json({ message: 'Contato removido com sucesso' }, 200);
	});
}

export { registerRoutersServicesMarketingContacts };
