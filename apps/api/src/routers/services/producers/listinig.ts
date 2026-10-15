import { zValidator } from '@hono/zod-validator';
import { SchemaSearchParamsProducerSimple } from '@segwise/core';
import type { ProducerListItem } from '@segwise/core/types';
import { fromZonedTime } from 'date-fns-tz';
import type { Server } from '@/@types/server.d';
import { Prisma } from '@/generated/prisma/client';
import { Role, StatusInvitation } from '@/generated/prisma/enums';
import { EXCLUDED_PRODUCER_ID } from '@/libraries/dashboard/metrics';
import { selectPrisma } from '@/libraries/database/adapters/producer/simple';
import { serializerCursor } from '@/libraries/database/serializers/cursor';
import { serializer } from '@/libraries/database/serializers/producer/simple';

type Filters = {
	brokerId: string;
	search?: string | null;
	kind?: 'all' | 'partner' | 'producer' | null;
	status?: 'all' | 'active' | 'suspended' | 'pending' | null;
	from?: string | null;
	to?: string | null;
	timezone: string;
};

// Listagem única: quem já é membro da corretora (ativo ou suspenso) e quem ainda
// tem convite pendente. Os dois tipos de linha vêm de tabelas diferentes, então
// são unidos aqui e ordenados por `id` (UUID v7 = ordem de criação), que também
// é o cursor da paginação.
function buildProducersCte({
	brokerId,
	search,
	kind,
	status,
	from,
	to,
	timezone,
}: Filters) {
	const like = search
		? `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
		: null;

	const typeFilter = (column: Prisma.Sql) =>
		kind === 'partner'
			? Prisma.sql`AND ${column} IS NOT NULL`
			: kind === 'producer'
				? Prisma.sql`AND ${column} IS NULL`
				: Prisma.empty;

	const sinceFilter = (column: Prisma.Sql) =>
		Prisma.sql`${
			from
				? Prisma.sql`AND ${column} >= ${fromZonedTime(`${from}T00:00:00.000`, timezone)}`
				: Prisma.empty
		} ${
			to
				? Prisma.sql`AND ${column} <= ${fromZonedTime(`${to}T23:59:59.999`, timezone)}`
				: Prisma.empty
		}`;

	const parts: Array<Prisma.Sql> = [];

	if (status !== 'pending') {
		parts.push(Prisma.sql`
			SELECT u."id" AS id, 'active'::text AS origin
			FROM "members" m
			JOIN "users" u ON u."id" = m."user_id"
			WHERE m."broker_id" = ${brokerId}::uuid
				AND m."role" = 'producer'::"Role"
				AND u."id" <> ${EXCLUDED_PRODUCER_ID}::uuid
				AND u."role" = 'customer'::"Role"
				${status === 'active' ? Prisma.sql`AND m."status" = 'active'::"StatusMember"` : Prisma.empty}
				${status === 'suspended' ? Prisma.sql`AND m."status" = 'suspended'::"StatusMember"` : Prisma.empty}
				${typeFilter(Prisma.sql`m."type_of_production"`)}
				${sinceFilter(Prisma.sql`m."created_at"`)}
				${like ? Prisma.sql`AND (u."name" ILIKE ${like} OR u."email" ILIKE ${like})` : Prisma.empty}
		`);
	}

	if (!status || status === 'all' || status === 'pending') {
		parts.push(Prisma.sql`
			SELECT i."id" AS id, 'pending'::text AS origin
			FROM "invitation" i
			LEFT JOIN "users" u ON u."email" = i."email"
			WHERE i."broker_id" = ${brokerId}::uuid
				AND i."role" = 'producer'::"Role"
				AND i."status" = 'pending'::"StatusInvitation"
				${typeFilter(Prisma.sql`i."type_of_production"`)}
				${sinceFilter(Prisma.sql`i."created_at"`)}
				${like ? Prisma.sql`AND (u."name" ILIKE ${like} OR i."email" ILIKE ${like})` : Prisma.empty}
		`);
	}

	return Prisma.sql`WITH producers AS (${Prisma.join(parts, ' UNION ALL ')})`;
}

type Row = { id: string; origin: 'active' | 'pending' };

function registerRoutersServicesProducersSimpleListining(server: Server) {
	server.get(
		'/simple',
		zValidator('query', SchemaSearchParamsProducerSimple),
		async (ctx) => {
			const brokerId = ctx.session.brokerId;

			const { cursor, limit, search, kind, status, from, to } =
				ctx.req.valid('query');

			const pageSize = limit as number;
			const pageMargins = 2;

			if (!brokerId) {
				return ctx.json(serializerCursor([], { total: 0 }), 200);
			}

			const cte = buildProducersCte({
				brokerId,
				search,
				kind,
				status,
				from,
				to,
				timezone: ctx.timezone,
			});

			const db = ctx.database;

			const [[{ total }], rows, [{ before }]] = await Promise.all([
				db.$queryRaw<[{ total: number }]>(
					Prisma.sql`${cte} SELECT count(*)::int AS total FROM producers`,
				),
				db.$queryRaw<Array<Row>>(
					Prisma.sql`${cte} SELECT id::text AS id, origin FROM producers
						${cursor ? Prisma.sql`WHERE id <= ${cursor}::uuid` : Prisma.empty}
						ORDER BY id DESC LIMIT ${pageSize + 1}`,
				),
				db.$queryRaw<[{ before: number }]>(
					cursor
						? Prisma.sql`${cte} SELECT count(*)::int AS before FROM producers WHERE id > ${cursor}::uuid`
						: Prisma.sql`SELECT 0::int AS before`,
				),
			]);

			const currentPage = Math.floor(before / pageSize) + 1;
			const totalPages = Math.ceil(total / pageSize);

			const pageRows = rows.slice(0, pageSize);
			const nextCursor = rows[pageSize]?.id || null;

			// Cursor de cada página = id do registro na posição (n-1)*limit.
			const pagesToShow: Array<number> = [];

			for (
				let n = Math.max(1, currentPage - pageMargins);
				n <= Math.min(totalPages, currentPage + pageMargins);
				n++
			) {
				pagesToShow.push(n);
			}

			const previousPosition =
				before > 0 ? Math.max(before - pageSize, 0) : null;
			const lastPosition = totalPages > 0 ? (totalPages - 1) * pageSize : null;

			const positions = [
				...new Set(
					[
						previousPosition,
						lastPosition,
						...pagesToShow.map((n) => (n - 1) * pageSize),
					].filter((position): position is number => position !== null),
				),
			];

			const idAtPosition = new Map<number, string>();

			if (positions.length) {
				const found = await db.$queryRaw<Array<{ id: string; pos: number }>>(
					Prisma.sql`${cte}
						SELECT id::text AS id, pos FROM (
							SELECT id, (row_number() OVER (ORDER BY id DESC) - 1)::int AS pos FROM producers
						) ranked
						WHERE pos IN (${Prisma.join(positions)})`,
				);

				for (const row of found) {
					idAtPosition.set(row.pos, row.id);
				}
			}

			const previousCursor =
				previousPosition === null
					? null
					: (idAtPosition.get(previousPosition) ?? null);

			const pages: Record<
				number | 'first' | 'last' | 'count',
				string | number | null
			> = {
				first: null,
				last:
					lastPosition === null
						? null
						: (idAtPosition.get(lastPosition) ?? null),
				count: totalPages,
			};

			for (const n of pagesToShow) {
				pages[n] =
					n === 1 ? null : (idAtPosition.get((n - 1) * pageSize) ?? null);
			}

			// Detalhes das linhas da página, mantendo a ordem da união.
			const activeIds = pageRows
				.filter((row) => row.origin === 'active')
				.map((row) => row.id);
			const pendingIds = pageRows
				.filter((row) => row.origin === 'pending')
				.map((row) => row.id);

			const [users, invitations] = await Promise.all([
				activeIds.length
					? db.user.findMany({
							where: { id: { in: activeIds }, role: Role.customer },
							select: selectPrisma,
							relationLoadStrategy: 'join',
						})
					: [],
				pendingIds.length
					? db.invitation.findMany({
							where: { id: { in: pendingIds } },
							select: {
								id: true,
								email: true,
								referral: true,
								typeOfProduction: true,
								percentageOfProduction: true,
								typeOfProductionPayment: true,
								startOfProductionPayment: true,
								createdAt: true,
								expiresAt: true,
							},
						})
					: [],
			]);

			const invitedUsers = invitations.length
				? await db.user.findMany({
						where: { email: { in: invitations.map((item) => item.email) } },
						select: { email: true, name: true, phone: true },
					})
				: [];

			const usersById = new Map(users.map((user) => [user.id, user]));
			const invitationsById = new Map(
				invitations.map((item) => [item.id, item]),
			);
			const invitedByEmail = new Map(
				invitedUsers.map((user) => [user.email, user]),
			);

			const data: Array<ProducerListItem> = [];

			for (const row of pageRows) {
				if (row.origin === 'active') {
					const user = usersById.get(row.id);

					if (user) {
						data.push({
							...serializer(user, { storage: ctx.storage.images }),
							origin: 'active',
						});
					}

					continue;
				}

				const invitation = invitationsById.get(row.id);

				if (invitation) {
					const invited = invitedByEmail.get(invitation.email);

					data.push({
						id: invitation.id,
						origin: 'pending',
						kind: invitation.typeOfProduction ? 'partner' : 'producer',
						name: invited?.name ?? null,
						email: invitation.email,
						phone: invited?.phone ?? null,
						referral: invitation.referral,
						typeOfProduction: invitation.typeOfProduction,
						percentageOfProduction: invitation.percentageOfProduction,
						typeOfProductionPayment: invitation.typeOfProductionPayment,
						startOfProductionPayment: invitation.startOfProductionPayment,
						invitedAt: invitation.createdAt.toISOString(),
						expiresAt: invitation.expiresAt.toISOString(),
					});
				}
			}

			return ctx.json(
				serializerCursor(data, {
					total,
					...(!!previousCursor && { previous: previousCursor }),
					...(!!nextCursor && { next: nextCursor }),
					pages,
				}),
				200,
			);
		},
	);

	// Seletores (cotação, proposta e filtros): quem já é membro e também quem ainda
	// não confirmou o e-mail, que já pode receber cotações e propostas.
	server.get('/simple/full', async (ctx) => {
		const brokerId = ctx.session.brokerId;

		const [producers, invitations] = await Promise.all([
			ctx.database.user.findMany({
				where: {
					// O produtor de teste só aparece no painel dele.
					id: { not: EXCLUDED_PRODUCER_ID },
					...(!!brokerId && {
						role: Role.customer,
						members: {
							some: {
								brokerId,
								role: Role.producer,
							},
						},
					}),
				},
				select: selectPrisma,
			}),
			brokerId
				? ctx.database.invitation.findMany({
						where: {
							brokerId,
							role: Role.producer,
							status: StatusInvitation.pending,
						},
						select: {
							email: true,
							referral: true,
							typeOfProduction: true,
							percentageOfProduction: true,
							typeOfProductionPayment: true,
							startOfProductionPayment: true,
							createdAt: true,
						},
					})
				: [],
		]);

		const invitedUsers = invitations.length
			? await ctx.database.user.findMany({
					where: {
						email: { in: invitations.map((item) => item.email) },
						role: Role.customer,
					},
					select: selectPrisma,
				})
			: [];

		const invitationByEmail = new Map(
			invitations.map((item) => [item.email, item]),
		);

		const memberIds = new Set(producers.map((user) => user.id));

		const pending = invitedUsers
			.filter((user) => !memberIds.has(user.id))
			.map((user) => {
				const invitation = invitationByEmail.get(user.email);

				// Ainda sem Member: o convite faz o papel dele na serialização.
				return {
					...user,
					members: invitation
						? [
								{
									referral: invitation.referral,
									typeOfProduction: invitation.typeOfProduction,
									typeOfProductionPayment: invitation.typeOfProductionPayment,
									percentageOfProduction: invitation.percentageOfProduction,
									startOfProductionPayment: invitation.startOfProductionPayment,
									status: 'active' as const,
									createdAt: invitation.createdAt,
								},
							]
						: [],
				};
			});

		return ctx.json(
			[...producers, ...pending]
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((props) =>
					serializer(props, {
						storage: ctx.storage.images,
					}),
				),
			200,
		);
	});
}

export { registerRoutersServicesProducersSimpleListining };
