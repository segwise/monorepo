import { Prisma } from '@segwise/database/client';
import type { Server } from '@/@types/server';
import { fee } from '@/const/fee';

function registerRoutersServicesPIX(server: Server) {
	const base = server.basePath('/pix');

	base.get('/get-amount', async (ctx) => {
		return ctx.json(
			{
				amount: ctx.environment.AMOUNT_SEARCH_VEHICLE_COMPLETE,
			},
			200,
		);
	});

	base.get('/:id/status', async (ctx) => {
		const id = ctx.req.param('id');

		const { data } = await ctx.transfeera.get(`/pix/qrcode/${id}`);

		return ctx.json(
			{
				status: data.status === 'CONCLUIDA' ? 'paid' : 'pending',
			},
			200,
		);
	});

	base.get('/', async (ctx) => {
		const amount = new Prisma.Decimal(
			ctx.environment.AMOUNT_SEARCH_VEHICLE_COMPLETE,
		);

		const split = Prisma.Decimal.max(1, amount.mul(fee.percent).div(100));

		const { data } = await ctx.transfeera.post(
			'/pix/qrcode/collection/immediate',
			{
				pix_key: ctx.environment.TRANSFEERA_PAYMENT_PIX_KEY,
				original_value: amount.toDecimalPlaces(2).toNumber(),
				payer_question: 'Pagamento referente a consulta veicular completa',
				value_change_mode: 'VALOR_FIXADO',
				split_payment: [
					{
						mode: 'FIXADO',
						amount: split.toDecimalPlaces(2).toNumber(),
						destination_bank_account: {
							pix_key_type: ctx.environment.TRANSFEERA_PAYMENT_SPLIT_PIX_TYPE,
							pix_key: ctx.environment.TRANSFEERA_PAYMENT_SPLIT_PIX,
						},
					},
				],
			},
		);

		const response = {
			id: data.id,
			amount: data.original_value,
			expiration: data.expiration,
			code: data.emv_payload,
			base64: data.image_base64,
			status: 'pending',
		};

		await ctx.cache.set(
			`pix:${response.id}`,
			JSON.stringify(response),
			'EX',
			response.expiration,
		);

		return ctx.json(response, 200);
	});
}

export { registerRoutersServicesPIX };
