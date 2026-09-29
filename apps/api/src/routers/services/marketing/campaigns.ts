import { zValidator } from '@hono/zod-validator';
import { SchemaMarketingCampaign } from '@segwise/core';
import type { Server } from '@/@types/server';
import {
	enqueueCampaignNow,
	removeCampaignSchedule,
	syncCampaignSchedule,
} from '@/libraries/marketing/queue';
import { marketingTemplates } from '@/libraries/marketing/templates';

function requireBroker(brokerId?: string | null) {
	if (!brokerId) {
		throw new Error('Nenhuma corretora vinculada');
	}

	return brokerId;
}

function registerRoutersServicesMarketingCampaigns(server: Server) {
	server.get('/templates', (ctx) =>
		ctx.json(
			Object.entries(marketingTemplates).map(([value, template]) => ({
				value,
				label: template.label,
				defaultSubject: template.defaultSubject,
			})),
			200,
		),
	);

	server.get('/campaigns', async (ctx) => {
		const brokerId = requireBroker(ctx.session.brokerId);

		const campaigns = await ctx.database.marketingCampaign.findMany({
			where: { brokerId },
			orderBy: { createdAt: 'desc' },
			include: { _count: { select: { contacts: true } } },
		});

		return ctx.json(
			campaigns.map(({ _count, ...campaign }) => ({
				...campaign,
				contactsCount: _count.contacts,
				lastRunAt: campaign.lastRunAt?.toISOString() ?? null,
				createdAt: campaign.createdAt.toISOString(),
			})),
			200,
		);
	});

	server.post(
		'/campaigns',
		zValidator('json', SchemaMarketingCampaign),
		async (ctx) => {
			const brokerId = requireBroker(ctx.session.brokerId);
			const body = ctx.req.valid('json');

			const campaign = await ctx.database.marketingCampaign.create({
				data: {
					...body,
					brokerId,
					dayOfMonth: body.frequency === 'monthly' ? body.dayOfMonth : null,
				},
			});

			await syncCampaignSchedule(campaign);

			return ctx.json({ id: campaign.id }, 201);
		},
	);

	server.put(
		'/campaigns/:id',
		zValidator('json', SchemaMarketingCampaign),
		async (ctx) => {
			const brokerId = requireBroker(ctx.session.brokerId);
			const id = ctx.req.param('id');
			const body = ctx.req.valid('json');

			const exists = await ctx.database.marketingCampaign.findFirst({
				where: { id, brokerId },
				select: { id: true },
			});

			if (!exists) {
				return ctx.json({ message: 'Campanha não encontrada' }, 404);
			}

			const campaign = await ctx.database.marketingCampaign.update({
				where: { id },
				data: {
					...body,
					dayOfMonth: body.frequency === 'monthly' ? body.dayOfMonth : null,
				},
			});

			await syncCampaignSchedule(campaign);

			return ctx.json({ id: campaign.id }, 200);
		},
	);

	server.delete('/campaigns/:id', async (ctx) => {
		const brokerId = requireBroker(ctx.session.brokerId);
		const id = ctx.req.param('id');

		const { count } = await ctx.database.marketingCampaign.deleteMany({
			where: { id, brokerId },
		});

		if (!count) {
			return ctx.json({ message: 'Campanha não encontrada' }, 404);
		}

		await removeCampaignSchedule(id);

		return ctx.json({ message: 'Campanha excluída com sucesso' }, 200);
	});

	server.post('/campaigns/:id/send', async (ctx) => {
		const brokerId = requireBroker(ctx.session.brokerId);
		const id = ctx.req.param('id');

		const campaign = await ctx.database.marketingCampaign.findFirst({
			where: { id, brokerId },
			select: { id: true, _count: { select: { contacts: true } } },
		});

		if (!campaign) {
			return ctx.json({ message: 'Campanha não encontrada' }, 404);
		}

		if (!campaign._count.contacts) {
			return ctx.json({ message: 'A campanha não tem contatos' }, 400);
		}

		await enqueueCampaignNow(id);

		return ctx.json({ message: 'Envio adicionado à fila' }, 202);
	});
}

export { registerRoutersServicesMarketingCampaigns };
