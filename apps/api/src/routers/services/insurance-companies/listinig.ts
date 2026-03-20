import z from 'zod';
import type { Server } from '@/@types/server.d';
import type { InsuranceCompanyWhereUniqueInput } from '@/generated/prisma/models';
import { selectPrisma as selectPrismaDetails } from '@/libraries/database/adapters/insurance-company/details';
import { selectPrisma as selectPrismaSimple } from '@/libraries/database/adapters/insurance-company/simple';
import { serializer as serializerDetails } from '@/libraries/database/serializers/insurance-company/details';
import { serializer as serializerSimple } from '@/libraries/database/serializers/insurance-company/simple';

function registerRoutersServicesInsuranceCompaniesListining(server: Server) {
	server.get(`/:id{${z.regexes.uuid7.source.slice(1)}}`, async (ctx) => {
		const id = ctx.req.param('id');

		const where: InsuranceCompanyWhereUniqueInput = {
			id,
		};

		const insuranceCompany = await ctx.database.insuranceCompany.findUnique({
			where,
			select: selectPrismaDetails,
		});

		if (!insuranceCompany) {
			return ctx.json(
				{
					message: 'Seguradora não encontrada',
				},
				404,
			);
		}

		const data = serializerDetails(insuranceCompany, {
			storage: ctx.storage.images,
		});

		return ctx.json(data, 200);
	});

	server.get('/simple', async (ctx) => {
		const insuranceCompanies = await ctx.database.insuranceCompany.findMany({
			select: selectPrismaSimple,
		});

		const data = insuranceCompanies.map((props) =>
			serializerSimple(props, {
				storage: ctx.storage.images,
			}),
		);

		return ctx.json(data, 200);
	});
}

export { registerRoutersServicesInsuranceCompaniesListining };
