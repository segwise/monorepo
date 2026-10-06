import { isCNPJ, isCPF, isPhone, isPlate, maskNumber } from '@segwise/core';
import type { SchemaSearchParamsSafeSimple } from '@segwise/core/schemas';
import { endOfDay, startOfDay, subYears } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type z from 'zod';
import type { Context } from '@/@types/server';
import { expirationRange } from '@/functions/date/expiration-range';
import { type Prisma, Role } from '@/generated/prisma/client';

type SafeSimpleQuery = z.infer<typeof SchemaSearchParamsSafeSimple> & {
	isExternal?: boolean | null;
};

const ORDER_BY_SEARCH: Prisma.SafeOrderByWithRelationInput[] = [
	{ expiration: 'desc' },
	{ insured: { name: 'asc' } },
];

const ORDER_BY: Prisma.SafeOrderByWithRelationInput[] = [
	{ expiration: 'asc' },
	{ insured: { name: 'asc' } },
];

/**
 * Extraído de `listinig.ts` para ser reaproveitado, byte a byte na lógica de
 * filtro, pela impressão em massa (`print.ts`) — ambos precisam retornar
 * exatamente o mesmo conjunto de registros para o mesmo conjunto de filtros.
 * Qualquer alteração de filtro na listagem tem que vir aqui também.
 */
async function buildSafeSimpleWhere(
	query: SafeSimpleQuery,
	ctx: Pick<Context, 'session' | 'database' | 'timezone'>,
) {
	const {
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
	} = query;

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
			// Placas ficam gravadas em minúsculas (o front envia em maiúsculas) e o
			// mesmo veículo pode ter a placa antiga e a Mercosul: casa as duas.
			const plate = search.replaceAll('-', '').toLowerCase();

			andConditions.push({
				safeVehicle: {
					OR: [
						{ plate },
						{ vehicle: { OR: [{ plate }, { plateAlternative: plate }] } },
					],
				},
			});
		} else {
			andConditions.push({
				OR: [
					{
						insured: {
							name: { contains: search.trim(), mode: 'insensitive' },
						},
					},
					{
						temporaryInsured: {
							name: { contains: search.trim(), mode: 'insensitive' },
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

	// Usado só para exibição (ex.: cabeçalho da impressão) — a data/hora
	// efetivamente aplicada no filtro de vigência, já considerando o default
	// ("hoje") quando não há data explícita nem busca/ids. Os operadores
	// lt/lte exatos usados na query ficam abaixo, em `where`; aqui a
	// diferença de milissegundos entre os dois não importa para exibição.
	const usesEffectivedAtFilter = !search && !ids?.length;
	const effectiveEffectivedAt = usesEffectivedAtFilter
		? effectivedAt
			? {
					start: startOfDay(toZonedTime(effectivedAt.start, 'UTC')),
					end: endOfDay(toZonedTime(effectivedAt.end, 'UTC')),
				}
			: {
					start: startOfDay(toZonedTime(new Date(), ctx.timezone)),
					end: endOfDay(toZonedTime(new Date(), ctx.timezone)),
				}
		: null;

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
					expiration: expirationRange(effectivedAt),
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

	return { where, brokerId, orderBy, effectiveEffectivedAt };
}

export { buildSafeSimpleWhere, ORDER_BY, ORDER_BY_SEARCH };
export type { SafeSimpleQuery };
