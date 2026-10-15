import { zValidator } from '@hono/zod-validator';
import {
	SchemaSearchParamsSafeRegistration,
	SchemaSearchParamsSafeSimple,
} from '@segwise/core/schemas';
import { set } from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server.d';
import { selectPrisma } from '@/db-adapters/safe/simple';
import { serializer } from '@/db-serializers/safe/simple';
import { type Prisma, StatusSafe } from '@/generated/prisma/client';
import { notTestProducer } from '@/libraries/dashboard/metrics';
import { serializerCursor } from '@/libraries/database/serializers/cursor';
import { buildSafeSimpleWhere } from './build-safe-simple-where';

const ORDER_BY_REVERSED_SEARCH: Prisma.SafeOrderByWithRelationInput[] = [
	{ expiration: 'asc' },
	{ insured: { name: 'desc' } },
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
			const { cursor, limit, search } = ctx.req.valid('query');

			const { where, orderBy } = await buildSafeSimpleWhere(
				ctx.req.valid('query'),
				ctx,
			);

			const take = limit as number;

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
				AND: [notTestProducer],
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
				AND: [notTestProducer],
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
