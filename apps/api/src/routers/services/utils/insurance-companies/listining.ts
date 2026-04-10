import { zValidator } from '@hono/zod-validator';
import { SchemaSearchParamsInsuranceCompanySimple } from '@segwise/core';
import type { Server } from '@/@types/server.d';
import type { Prisma } from '@/generated/prisma/client';
import { selectPrisma as selectPrismaSimple } from '@/libraries/database/adapters/insurance-company/simple';
import { serializer as serializerSimple } from '@/libraries/database/serializers/insurance-company/simple';

function registerRoutersServicesUtilsInsuranceCompaniesListining(
	server: Server,
) {
	server.get(
		'/simple',
		zValidator('query', SchemaSearchParamsInsuranceCompanySimple),
		async (ctx) => {
			const { search } = ctx.req.valid('query');

			const where: Prisma.InsuranceCompanyWhereInput = {
				...(!!search && {
					name: {
						search: search.replaceAll(' ', '&'),
						mode: 'insensitive',
					},
				}),
			};

			const insuranceCompanies = await ctx.database.insuranceCompany.findMany({
				where,
				select: selectPrismaSimple,
				orderBy: {
					name: 'asc',
				},
				relationLoadStrategy: 'join',
			});

			const data = insuranceCompanies.map((props) =>
				serializerSimple(props, {
					storage: ctx.storage.images,
				}),
			);

			return ctx.json(data, 200);
		},
	);
}

export { registerRoutersServicesUtilsInsuranceCompaniesListining };
