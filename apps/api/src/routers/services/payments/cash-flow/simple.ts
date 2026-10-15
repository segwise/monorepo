import { zValidator } from '@hono/zod-validator';
import { getDefaultFilterDate } from '@segwise/core';
import { SchemaSearchParamsPaymentSimple } from '@segwise/core/schemas';
import type { Server } from '@/@types/server.d';
import { selectPrisma } from '@/db-adapters/payment/simple';
import { serializer } from '@/db-serializers/payment/simple';
import { timestampRange } from '@/functions/date/timestamp-range';
import type { Prisma } from '@segwise/database/client';
import { paymentNotTestProducer } from '@/libraries/dashboard/metrics';
import { serializerCursor } from '@/libraries/database/serializers/cursor';

function registerRoutersServicesPaymentsCashFlowSimpleListining(
	server: Server,
) {
	server.get(
		'/simple',
		zValidator(
			'query',
			SchemaSearchParamsPaymentSimple.transform((props) => ({
				...props,
				...(!props.expiration &&
					!props.paidAt && {
						expiration: getDefaultFilterDate(),
					}),
			})),
		),
		async (ctx) => {
			const brokerId = ctx.session.brokerId;

			const { cursor, limit, search, payers, receivers, expiration, paidAt } =
				ctx.req.valid('query');

			const pageMargins = 2;

			const where: Prisma.PaymentWhereInput = {
				...paymentNotTestProducer,
				...(!!brokerId && {
					OR: [
						{
							payerId: brokerId,
						},
						{
							receiverId: brokerId,
						},
					],
				}),
				...(search && {
					OR: [
						{
							payer: {
								OR: [
									{
										broker: {
											OR: [
												{
													name: {
														contains: search.trim(),
														mode: 'insensitive',
													},
												},
												{
													fantasy: {
														contains: search.trim(),
														mode: 'insensitive',
													},
												},
											],
										},
									},
									{
										user: {
											name: {
												contains: search.trim(),
												mode: 'insensitive',
											},
										},
									},
									{
										insuranceCompany: {
											OR: [
												{
													name: {
														contains: search.trim(),
														mode: 'insensitive',
													},
												},
												// {
												// 	fantasy: {
												//
												// 		contains: search.trim(), mode: 'insensitive',
												// 	},
												// },
											],
										},
									},
								],
							},
						},
						{
							receiver: {
								OR: [
									{
										broker: {
											OR: [
												{
													name: {
														contains: search.trim(),
														mode: 'insensitive',
													},
												},
												{
													fantasy: {
														contains: search.trim(),
														mode: 'insensitive',
													},
												},
											],
										},
									},
									{
										user: {
											name: {
												contains: search.trim(),
												mode: 'insensitive',
											},
										},
									},
									{
										insuranceCompany: {
											OR: [
												{
													name: {
														contains: search.trim(),
														mode: 'insensitive',
													},
												},
												// {
												// 	fantasy: {
												//
												// 		contains: search.trim(), mode: 'insensitive',
												// 	},
												// },
											],
										},
									},
								],
							},
						},
					],
				}),
				...(payers && {
					payerId: {
						in: payers,
					},
				}),
				...(receivers && {
					receiverId: {
						in: receivers,
					},
				}),
				...(expiration && {
					expiration: timestampRange(expiration, ctx.timezone),
				}),
				...(paidAt && {
					paidAt: timestampRange(paidAt, ctx.timezone),
				}),
			};

			const [payments, total, itemsBefore] = await ctx.database.$transaction([
				ctx.database.payment.findMany({
					where,
					...(cursor && {
						cursor: {
							id: cursor,
						},
					}),
					take: (limit as number) + 1,
					orderBy: {
						id: 'desc',
					},
					select: selectPrisma,
					relationLoadStrategy: 'join',
				}),
				ctx.database.payment.count({ where }),
				cursor
					? ctx.database.payment.count({
							where: {
								...where,
								id: { gt: cursor },
							},
						})
					: ctx.database.payment.count({
							where: {
								...where,
								id: { in: [] },
							},
							take: 0,
						}),
			]);

			const currentPage = cursor
				? Math.floor(itemsBefore / (limit as number)) + 1
				: 1;

			const totalPages = Math.ceil(total / (limit as number));

			const nextCursor = payments[limit as number]?.id || null;

			let previousCursor = !payments.length
				? null
				: !cursor
					? null
					: (await ctx.database.payment
							.findFirst({
								where,
								cursor: {
									id: payments[0]?.id,
								},
								orderBy: {
									id: 'asc',
								},
								skip: limit as number,
								select: {
									id: true,
								},
							})
							.then((response) => response?.id)) || null;

			if (cursor === previousCursor) {
				previousCursor = null;
			}

			const pages: Record<
				number | 'first' | 'last' | 'count',
				string | number | null
			> = {
				first: null,
				last: null,
				count: totalPages,
			};

			pages[currentPage] = currentPage === 1 ? null : (cursor as string);

			let tempCursorForward = nextCursor;
			for (let i = 1; i <= pageMargins; i++) {
				if (!tempCursorForward) break;

				const pageNum = currentPage + i;
				pages[pageNum] = tempCursorForward;

				if (i < pageMargins) {
					const batchForward = await ctx.database.payment.findFirst({
						where,
						cursor: { id: tempCursorForward },
						skip: limit as number,
						orderBy: { id: 'desc' },
						select: { id: true },
					});

					tempCursorForward = batchForward?.id || null;
				}
			}

			if (currentPage > 1 && previousCursor) {
				const pageNumPrev1 = currentPage - 1;

				pages[pageNumPrev1] = pageNumPrev1 === 1 ? null : previousCursor;

				let tempCursorBackward = previousCursor;
				const maxBack = Math.min(pageMargins, currentPage - 1);

				for (let d = 2; d <= maxBack; d++) {
					const batchBackward = await ctx.database.payment.findFirst({
						where,
						cursor: { id: tempCursorBackward },
						skip: limit as number,
						orderBy: { id: 'asc' },
						select: { id: true },
					});

					const furtherPrev = batchBackward?.id || null;
					if (!furtherPrev) break;

					const pageNum = currentPage - d;

					pages[pageNum] = pageNum === 1 ? null : furtherPrev;

					tempCursorBackward = furtherPrev;
				}
			}

			const skipGetLastPage = (total % (limit as number)) - 1;

			const lastPage = await ctx.database.payment.findFirst({
				where,
				orderBy: { id: 'asc' },
				skip: skipGetLastPage >= 0 ? skipGetLastPage : (limit as number) - 1,
				select: { id: true },
			});

			if (lastPage?.id) {
				pages.last = lastPage.id;
			}

			const pagePayments = payments.slice(0, limit as number);

			return ctx.json(
				serializerCursor(
					pagePayments.map((props) =>
						serializer(props, {
							storage: ctx.storage.images,
							brokerId,
						}),
					),
					{
						total,
						...(!!previousCursor && {
							previous: previousCursor,
						}),
						...(!!nextCursor && {
							next: nextCursor,
						}),
						...(!!pages && {
							pages,
						}),
					},
				),
				200,
			);
		},
	);
}

export { registerRoutersServicesPaymentsCashFlowSimpleListining };
