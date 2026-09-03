import { zValidator } from '@hono/zod-validator';
import { isCNPJ, isCPF, isPhone, isPlate, maskNumber } from '@segwise/core';
import {
	SchemaSearchParamsSafeRegistration,
	SchemaSearchParamsSafeSimple,
} from '@segwise/core/schemas';
import { endOfDay, set, startOfDay, subYears } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import z from 'zod';
import type { Server } from '@/@types/server.d';
import { selectPrisma } from '@/db-adapters/safe/simple';
import { serializer } from '@/db-serializers/safe/simple';
import { type Prisma, Role, StatusSafe } from '@/generated/prisma/client';
import { serializerCursor } from '@/libraries/database/serializers/cursor';

const ORDER_BY_SEARCH: Prisma.SafeOrderByWithRelationInput[] = [
	{ expiration: 'desc' },
	{ insured: { name: 'asc' } },
];

const ORDER_BY_REVERSED_SEARCH: Prisma.SafeOrderByWithRelationInput[] = [
	{ expiration: 'asc' },
	{ insured: { name: 'desc' } },
];

const ORDER_BY: Prisma.SafeOrderByWithRelationInput[] = [
	{ expiration: 'asc' },
	{ insured: { name: 'asc' } },
];

const ORDER_BY_REVERSED: Prisma.SafeOrderByWithRelationInput[] = [
	{ expiration: 'desc' },
	{ insured: { name: 'desc' } },
];

/**
 * Calcula o cursor da página anterior a partir do resultado da query reversa.
 *
 * Regras (validadas por simulação, ver histórico da conversa):
 * - Se não sobrou o item "extra" (reversedPage.length <= take), mas ainda
 *   existe pelo menos 1 item, a página anterior É a primeira página —
 *   nesse caso o cursor correto é `null` (a query forward sem cursor já
 *   retorna a primeira página corretamente; não existe "id anterior ao
 *   primeiro item" para apontar).
 * - Se sobrou o item extra, o cursor correto é o ÚLTIMO item do slice
 *   usável (os `take` primeiros itens do reversedPage) — não o item
 *   extra em si. Usar o item extra desloca a página anterior em 1
 *   posição para trás; usar o primeiro item do slice usável desloca a
 *   página anterior em 1 posição para frente.
 */
function resolvePreviousCursor(
	reversedPage: { id: string }[],
	take: number,
): string | null {
	if (reversedPage.length === 0) {
		return null;
	}

	if (reversedPage.length <= take) {
		// Não sobrou o "+1": a página anterior é a primeira página.
		return null;
	}

	const usable = reversedPage.slice(0, take);
	return usable[usable.length - 1]?.id ?? null;
}

function registerRoutersServicesSafesSimpleListining(server: Server) {
	server.get(
		'/simple',
		zValidator(
			'query',
			SchemaSearchParamsSafeSimple.extend({
				isExternal: z
					.literal(['true', 'false'])
					.or(z.boolean())
					.transform((value) =>
						value === 'true' ? true : value === 'false' ? false : value,
					)
					.nullish(),
			}),
		),
		async (ctx) => {
			const {
				cursor,
				limit,
				search,
				producers,
				insuranceCompanies,
				brokers,
				effectivedAt,
				modality,
				status,
				renewal,
				ids,
				isExternal,
			} = ctx.req.valid('query');

			const brokerId =
				ctx?.session?.brokerId ||
				(await ctx.database.broker
					.findFirst({
						orderBy: {
							createdAt: 'asc',
						},
						select: {
							id: true,
						},
					})
					.then((response) => response?.id));

			const take = limit as number;

			const andConditions: Prisma.SafeWhereInput[] = [];

			if (isExternal === false) {
				andConditions.push({
					OR: [{ isExternal: false }, { isExternal: null }],
				});
			}

			if (search) {
				if (isCNPJ(search)) {
					andConditions.push({
						insured: { cnpj: maskNumber(search) },
					});
				} else if (isCPF(search)) {
					andConditions.push({
						insured: { cpf: maskNumber(search) },
					});
				} else if (isPhone(search)) {
					andConditions.push({
						insured: { phone: { contains: maskNumber(search) } },
					});
				} else if (isPlate(search)) {
					andConditions.push({
						safeVehicle: { plate: search.replaceAll('-', '') },
					});
				} else {
					andConditions.push({
						OR: [
							{
								insured: {
									name: { search: search.replaceAll(' ', '&') },
								},
							},
							{
								temporaryInsured: {
									name: { search: search.replaceAll(' ', '&') },
								},
							},
						],
					});
				}
			}

			if (!producers?.length) {
				andConditions.push({
					OR: [
						{ producerId: { not: '019f249d-8880-7000-b962-aace743e68e2' } },
						{ producerId: null },
					],
				});
			}

			const where: Prisma.SafeWhereInput = {
				...(!!brokerId && { brokerId }),
				...(ctx?.session?.role !== Role.customer &&
					!!brokers?.length && {
						broker: { id: { in: brokers } },
					}),
				...(!!ids?.length && { id: { in: ids } }),
				...(!!isExternal && { isExternal: true }),
				...(!!search && {
					expiration: {
						gte: subYears(startOfDay(new Date()), 1),
					},
				}),
				...(!search &&
					!ids?.length && {
						...(!!effectivedAt && {
							expiration: {
								gte: startOfDay(toZonedTime(effectivedAt.start, 'UTC')),
								lt: endOfDay(toZonedTime(effectivedAt.end, 'UTC')),
							},
						}),
						...(!effectivedAt && {
							expiration: {
								gte: startOfDay(toZonedTime(new Date(), ctx.timezone)),
								lte: endOfDay(toZonedTime(new Date(), ctx.timezone)),
							},
						}),
					}),
				...(!!renewal && { renewal }),
				...(!!producers?.length && { producerId: { in: producers } }),
				...(!!insuranceCompanies?.length && {
					insuranceCompanyId: { in: insuranceCompanies },
				}),
				...(!!modality && { modality: { in: modality } }),
				...(!!status && { status: { in: status } }),
				...(andConditions.length > 0 && { AND: andConditions }),
			};

			const orderBy = search ? ORDER_BY_SEARCH : ORDER_BY;
			const orderByReversed = search
				? ORDER_BY_REVERSED_SEARCH
				: ORDER_BY_REVERSED;

			const [safesWithExtra, total] = await ctx.database.$transaction([
				ctx.database.safe.findMany({
					where,
					...(cursor && {
						cursor: { id: cursor },
						skip: 1,
					}),
					take: take + 1,
					orderBy,
					select: selectPrisma,
					relationLoadStrategy: 'join',
				}),
				ctx.database.safe.count({ where }),
			]);

			const hasNextPage = safesWithExtra.length > take;
			const pageSafes = safesWithExtra.slice(0, take);
			const nextCursor = hasNextPage
				? (pageSafes[pageSafes.length - 1]?.id as string)
				: null;

			let previousCursor: string | null = null;

			if (cursor && pageSafes.length > 0) {
				const reversedPage = await ctx.database.safe.findMany({
					where,
					cursor: { id: cursor },
					skip: 1,
					take: take + 1,
					orderBy: orderByReversed,
					select: { id: true },
					relationLoadStrategy: 'join',
				});

				previousCursor = resolvePreviousCursor(reversedPage, take);
			}

			const hasPreviousPage = !!cursor && pageSafes.length > 0;

			return ctx.json(
				serializerCursor(pageSafes.map(serializer), {
					total,
					...(hasPreviousPage && { previous: previousCursor ?? '' }),
					...(!!nextCursor && { next: nextCursor }),
				}),
				200,
			);
		},
	);

	server.get(
		'/simple/registration',
		zValidator(
			'query',
			SchemaSearchParamsSafeRegistration.transform(
				({ registration, birth }) => ({
					registration,
					birth: set(birth, {
						hours: 12,
					}),
				}),
			),
		),
		async (ctx) => {
			const { registration, birth } = ctx.req.valid('query');

			const birthUtc = new Date(
				Date.UTC(birth.getFullYear(), birth.getMonth(), birth.getDate()),
			);

			const where: Prisma.SafeWhereInput = {
				OR: [
					{
						isExternal: false,
					},
					{
						isExternal: null,
					},
				],
				insured: {
					OR: [
						{
							cpf: registration,
						},
						{
							cnpj: registration,
						},
					],
					birth: birthUtc,
				},

				status: StatusSafe.active,
				expiration: {
					gte: new Date(),
				},
			};

			const [safes, count] = await ctx.database.$transaction([
				ctx.database.safe.findMany({
					where,
					select: selectPrisma,
					relationLoadStrategy: 'join',
				}),
				ctx.database.safe.count({
					where,
				}),
			]);

			if (!safes.length) {
				return ctx.json(
					{
						message: 'Seguros não encontrados',
					},
					404,
				);
			}

			const results = safes.map(serializer);

			return ctx.json(
				serializerCursor(results, {
					total: count,
				}),
				200,
			);
		},
	);

	server.get(
		'/simple/plate/:plate{^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$}',
		async (ctx) => {
			const { plate } = ctx.req.param();

			const plateFormatter = plate.replace('-', '').toLowerCase();

			const where: Prisma.SafeWhereInput = {
				OR: [
					{
						isExternal: false,
					},
					{
						isExternal: null,
					},
				],
				safeVehicle: {
					OR: [
						{
							plate: plateFormatter,
						},
						{
							plate: plateFormatter.toUpperCase(),
						},
					],
				},
			};

			const safe = await ctx.database.safe.findFirst({
				where,
				select: selectPrisma,
				relationLoadStrategy: 'join',
				orderBy: {
					requestedAt: 'desc',
				},
			});

			if (!safe) {
				return ctx.json(
					{
						message: 'Seguro não encontrado',
					},
					404,
				);
			}

			return ctx.json(
				{
					type: 'safe',
					...serializer(safe),
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesSafesSimpleListining };
