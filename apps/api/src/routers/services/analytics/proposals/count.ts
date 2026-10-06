import { zValidator } from '@hono/zod-validator';
import {
	SchemaBasisOfAnalysis,
	SchemaSearchParamsSafeSimple,
} from '@segwise/core';
import { addYears } from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import type { Prisma } from '@/generated/prisma/client';
import { buildSafeSimpleWhere } from '@/routers/services/safes/build-safe-simple-where';

// Mesmo filtro da listagem de propostas (buildSafeSimpleWhere), então
// `current` é exatamente o total da tabela: propostas cujo FIM DE VIGÊNCIA cai
// no período filtrado (a listagem pagina por vigência, não por cadastro).
// `next` é o mesmo período um ano depois: o que foi renovado ou emitido para
// o ano seguinte. Com busca por texto não existe período, então `next` é null.
function shiftOneYear(
	expiration: Prisma.SafeWhereInput['expiration'],
): Prisma.SafeWhereInput['expiration'] | null {
	if (!expiration || expiration instanceof Date) {
		return null;
	}

	const { gte, gt, lt, lte } = expiration as Prisma.DateTimeFilter;

	if (!(lt || lte)) {
		return null;
	}

	return {
		...(gte && { gte: addYears(gte as Date, 1) }),
		...(gt && { gt: addYears(gt as Date, 1) }),
		...(lt && { lt: addYears(lt as Date, 1) }),
		...(lte && { lte: addYears(lte as Date, 1) }),
	};
}

function registerRoutersServicesAnalyticsProposalsCount(server: Server) {
	const base = server.basePath('/count');

	base.get(
		'/',
		zValidator(
			'query',
			z
				.object({
					...SchemaSearchParamsSafeSimple.shape,
				})
				.extend({
					// Legado: a análise é sempre anual; aceito só para links antigos.
					basisOfAnalysis: SchemaBasisOfAnalysis.optional(),
				})
				.pick({
					basisOfAnalysis: true,
					search: true,
					producers: true,
					insuranceCompanies: true,
					brokers: true,
					effectivedAt: true,
					modality: true,
					status: true,
					renewal: true,
				})
				.strict(),
		),
		async (ctx) => {
			const { basisOfAnalysis: _legacy, ...query } = ctx.req.valid('query');

			const { where } = await buildSafeSimpleWhere({ ...query, limit: 1 }, ctx);

			const nextExpiration = query.search
				? null
				: shiftOneYear(where.expiration);

			const [current, next] = await Promise.all([
				ctx.database.safe.count({ where }),
				nextExpiration
					? ctx.database.safe.count({
							where: { ...where, expiration: nextExpiration },
						})
					: Promise.resolve(null),
			]);

			return ctx.json({ current, next }, 200);
		},
	);
}

export { registerRoutersServicesAnalyticsProposalsCount };
