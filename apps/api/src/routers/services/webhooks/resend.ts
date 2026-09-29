import type { Server } from '@/@types/server';

// Eventos do Resend (entregue/aberto/clicado/bounce) atualizam o
// MarketingDelivery correspondente pelo id do e-mail. Público, mas só aceita
// payload com assinatura válida.
function registerRoutersServicesWebhooksResend(server: Server) {
	server.post('/resend', async (ctx) => {
		const secret = ctx.environment.RESEND_WEBHOOK_SECRET;

		if (!secret) {
			return ctx.json({ message: 'Webhook não configurado' }, 503);
		}

		const payload = await ctx.req.text();

		let event: ReturnType<typeof ctx.email.webhooks.verify>;

		try {
			event = ctx.email.webhooks.verify({
				payload,
				headers: {
					id: ctx.req.header('svix-id') ?? '',
					timestamp: ctx.req.header('svix-timestamp') ?? '',
					signature: ctx.req.header('svix-signature') ?? '',
				},
				webhookSecret: secret,
			});
		} catch {
			return ctx.json({ message: 'Assinatura inválida' }, 401);
		}

		if (!('email_id' in event.data)) {
			return ctx.json({ ok: true }, 200);
		}

		const resendId = event.data.email_id as string;
		const now = new Date(event.created_at);

		const update = (
			data: Parameters<
				typeof ctx.database.marketingDelivery.updateMany
			>[0]['data'],
		) =>
			ctx.database.marketingDelivery.updateMany({
				where: { resendId },
				data,
			});

		switch (event.type) {
			case 'email.delivered':
				await update({ status: 'delivered', deliveredAt: now });
				break;
			case 'email.bounced':
				await update({ status: 'bounced' });
				break;
			case 'email.complained':
				await update({ status: 'complained' });
				break;
			case 'email.failed':
				await update({ status: 'failed' });
				break;
			case 'email.opened':
				await update({ openedAt: now, openCount: { increment: 1 } });
				break;
			case 'email.clicked':
				await update({ clickedAt: now, clickCount: { increment: 1 } });
				break;
		}

		return ctx.json({ ok: true }, 200);
	});
}

export { registerRoutersServicesWebhooksResend };
